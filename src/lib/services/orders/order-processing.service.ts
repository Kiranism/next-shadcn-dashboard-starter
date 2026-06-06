import { db } from '@/lib/db';
import { NormalizedOrder } from '../integration/tilda-parser.service';
import { UserService, BonusService } from '@/lib/services/user.service';
import { BonusLevelService } from '@/lib/services/bonus-level.service';
import { logger } from '@/lib/logger';

export interface OrderProcessingResult {
  success: boolean;
  message: string;
  data?: any;
}

export class OrderProcessingService {
  static async processOrder(
    projectId: string,
    order: NormalizedOrder
  ): Promise<OrderProcessingResult> {
    logger.info('Processing Order', { projectId, orderId: order.orderId });

    // 1. Get Project Settings
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    // 2. Save Order to Database
    const savedOrder = await this.saveOrder(projectId, order);

    const bonusBehavior = (project.bonusBehavior || 'SPEND_AND_EARN') as
      | 'SPEND_AND_EARN'
      | 'SPEND_ONLY'
      | 'EARN_ONLY';

    // 3. Find or Create User
    let user = await UserService.findUserByContact(
      projectId,
      order.email,
      order.phone
    );
    const userAlreadyExisted = Boolean(user);
    const isSignupForm =
      order.isSignupForm ??
      (order.amount <= 0 && (!order.products || order.products.length === 0));

    // Handle Email/Phone Conflict
    // If we found a user by phone, but they provided a DIFFERENT email:
    if (
      user &&
      order.email &&
      user.email &&
      user.email.toLowerCase() !== order.email.toLowerCase()
    ) {
      // Check if the NEW email is taken
      const emailOwner = await db.user.findFirst({
        where: {
          projectId,
          email: { equals: order.email, mode: 'insensitive' }
        }
      });

      if (emailOwner && emailOwner.id !== user.id) {
        logger.warn('Email conflict detected', {
          existingUserId: user.id,
          emailOwnerId: emailOwner.id,
          conflictEmail: order.email
        });
        // We DO NOT update user email to avoid account takeover/merging confusion
        // We proceed with the user found by phone (assuming phone is primary identifier)
      } else {
        // Safe to update email
        user = (await db.user.update({
          where: { id: user.id },
          data: { email: order.email },
          include: { project: true, bonuses: true, transactions: true }
        })) as any;
      }
    }

    if (!user) {
      const nameParts = order.name ? order.name.trim().split(' ') : ['', ''];
      user = await UserService.createUser({
        projectId,
        email: order.email || '',
        phone: order.phone || '',
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        utmSource: order.utmSource || '',
        utmOrg: order.utmOrg
      });
    } else if (isSignupForm && order.utmSource) {
      const linkResult = await UserService.linkReferralFromAttribution({
        userId: user.id,
        projectId,
        utmRef: order.utmSource,
        utmOrg: order.utmOrg
      });
      if (linkResult.linked) {
        user = (await db.user.findFirst({
          where: { id: user.id, projectId },
          include: { project: true, bonuses: true, transactions: true }
        })) as any;
      }
    }

    // 4. Link Order to User
    if (savedOrder && user) {
      await db.order.update({
        where: { id: savedOrder.id },
        data: { userId: user.id }
      });
    }

    // 5. Process Bonuses
    // Determine Logic
    // Legacy "GUPIL" promo code check replaced with generalized check or just appliedBonuses
    // We trust 'appliedBonuses' from TildaParserService which normalizes widget behavior

    const totalAmount = order.amount;
    const appliedRequested = order.appliedBonuses;

    const shouldSpend =
      appliedRequested > 0 &&
      (bonusBehavior === 'SPEND_AND_EARN' || bonusBehavior === 'SPEND_ONLY');

    let spentAmount = 0;
    let actuallySpent = false;

    if (shouldSpend) {
      const balance = await UserService.getUserBalance(user.id);
      const canSpend = Math.min(
        appliedRequested,
        Number(balance.currentBalance),
        totalAmount
      );

      if (canSpend > 0) {
        const transactions = await BonusService.spendBonuses(
          user.id,
          canSpend,
          `Order ${order.orderId}`,
          { orderId: order.orderId, source: 'tilda' }
        );
        spentAmount = transactions.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );
        actuallySpent = true;
      }
    }

    // 4. Earn Bonuses
    let shouldEarn = true;
    let earnBase = totalAmount;

    if (actuallySpent) {
      if (bonusBehavior === 'SPEND_ONLY') {
        shouldEarn = false;
      } else {
        earnBase = totalAmount - spentAmount;
      }
    }

    let earnedBonusAmount = 0;
    if (shouldEarn && earnBase > 0) {
      const result = await BonusService.awardPurchaseBonus(
        user.id,
        earnBase,
        order.orderId,
        `Order #${order.orderId}`
      );
      earnedBonusAmount = Number(result.bonus.amount);
    }

    return {
      success: true,
      message: userAlreadyExisted
        ? isSignupForm
          ? order.utmSource
            ? 'Пользователь уже существует — проверена привязка по реферальной ссылке'
            : 'Пользователь с таким email или телефоном уже зарегистрирован — новая запись не создана'
          : 'Order processed'
        : isSignupForm
          ? 'Пользователь зарегистрирован'
          : 'Order processed',
      data: {
        spent: spentAmount,
        earned: earnedBonusAmount,
        userId: user.id,
        orderId: savedOrder?.id,
        userCreated: !userAlreadyExisted,
        signupForm: isSignupForm
      }
    };
  }

  /**
   * Save order and products to database for analytics
   */
  private static async saveOrder(
    projectId: string,
    order: NormalizedOrder
  ): Promise<any> {
    try {
      // Create Order with full metadata
      const savedOrder = await db.order.create({
        data: {
          projectId,
          orderNumber: order.orderId,
          status: 'CONFIRMED',
          totalAmount: order.amount,
          paidAmount: order.amount - order.appliedBonuses,
          bonusAmount: order.appliedBonuses,
          paymentMethod: order.raw?.payment?.sys || 'unknown',
          deliveryMethod: order.raw?.payment?.delivery || null,
          deliveryAddress: order.raw?.payment?.delivery_address || null,
          metadata: {
            // Основные данные
            promocode: order.promocode,
            utmSource: order.utmSource,

            // Данные клиента
            customerName: order.name,
            customerEmail: order.email,
            customerPhone: order.phone,

            // Данные доставки
            deliveryFio: order.raw?.payment?.delivery_fio,
            deliveryZip: order.raw?.payment?.delivery_zip,
            deliveryCity: order.raw?.payment?.delivery_city,
            deliveryComment: order.raw?.payment?.delivery_comment,
            deliveryPrice: order.raw?.payment?.delivery_price,

            // Данные оплаты
            paymentSystem: order.raw?.payment?.sys,
            paymentTransactionId: order.raw?.payment?.systranid,
            subtotal: order.raw?.payment?.subtotal,

            // UTM метки
            utmCampaign: order.raw?.utm_campaign,
            utmMedium: order.raw?.utm_medium,
            utmContent: order.raw?.utm_content,
            utmTerm: order.raw?.utm_term,
            utmRef: order.raw?.utm_ref,

            // Cookies и дополнительные данные
            cookies: order.raw?.COOKIES,
            formId: order.raw?.formid,
            formName: order.raw?.formname,
            maId: order.raw?.ma_id,

            // Полные raw данные для полной истории
            raw: order.raw
          }
        }
      });

      // Create Order Items and Products
      if (order.products && order.products.length > 0) {
        for (const product of order.products) {
          // Find or create product
          let dbProduct = null;
          if (product.sku) {
            dbProduct = await db.product.findUnique({
              where: { sku: product.sku }
            });

            if (!dbProduct) {
              // Создаем товар со всеми данными включая изображения
              dbProduct = await db.product.create({
                data: {
                  projectId,
                  name: product.name,
                  sku: product.sku,
                  price: product.price,
                  metadata: {
                    // Изображение товара
                    image: product.img,

                    // Опции товара (вес, размер и т.д.)
                    options: product.options,

                    // External ID из Tilda
                    externalId: product.externalid,

                    // Все остальные данные
                    ...product
                  }
                }
              });
            } else {
              // Обновляем изображение если его нет
              if (product.img && !dbProduct.metadata?.image) {
                await db.product.update({
                  where: { id: dbProduct.id },
                  data: {
                    metadata: {
                      ...(dbProduct.metadata as any),
                      image: product.img,
                      options: product.options,
                      externalId: product.externalid
                    }
                  }
                });
              }
            }
          }

          // Create order item with full product data
          await db.orderItem.create({
            data: {
              orderId: savedOrder.id,
              productId: dbProduct?.id,
              name: product.name,
              quantity: product.quantity || 1,
              price: product.price,
              total: product.amount || product.price * (product.quantity || 1),
              metadata: {
                // Изображение товара
                image: product.img,

                // SKU
                sku: product.sku,

                // Опции (вес, размер и т.д.)
                options: product.options,

                // External ID
                externalId: product.externalid,

                // Все данные товара
                ...product
              }
            }
          });
        }
      }

      // Create analytics event
      await db.analyticsEvent.create({
        data: {
          projectId,
          orderId: savedOrder.id,
          eventType: 'order_created',
          data: {
            amount: order.amount,
            productsCount: order.products.length,
            appliedBonuses: order.appliedBonuses,
            paymentMethod: order.raw?.payment?.sys,
            deliveryMethod: order.raw?.payment?.delivery
          }
        }
      });

      return savedOrder;
    } catch (error) {
      logger.error('Failed to save order', { error, orderId: order.orderId });
      // Don't throw - order processing should continue even if analytics fails
      return null;
    }
  }
}
