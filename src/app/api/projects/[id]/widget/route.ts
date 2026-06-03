/**
 * @file: src/app/api/projects/[id]/widget/route.ts
 * @description: Публичный API для получения настроек виджета
 * @project: SaaS Bonus System
 * @dependencies: Prisma
 * @created: 2026-01-11
 * @author: AI Assistant + User
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

type LegacyWidgetSettings = Record<
  string,
  string | number | boolean | null | undefined
>;

function getLegacyString(
  settings: LegacyWidgetSettings,
  key: string
): string | undefined {
  const value = settings[key];
  return typeof value === 'string' ? value : undefined;
}

function getLegacyBoolean(
  settings: LegacyWidgetSettings,
  key: string
): boolean | undefined {
  const value = settings[key];
  return typeof value === 'boolean' ? value : undefined;
}

function getLegacyNumber(
  settings: LegacyWidgetSettings,
  key: string
): number | undefined {
  const value = settings[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function cleanObject<T extends Record<string, unknown>>(
  obj: T
): Prisma.InputJsonValue {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Prisma.InputJsonValue;
}

// CORS заголовки для публичного доступа
function createCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // Кэш на 5 минут
  };
}

// OPTIONS handler для CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders()
  });
}

// GET /api/projects/[id]/widget - Публичный endpoint для виджета
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    logger.info('GET /api/projects/[id]/widget запрос', {
      projectId,
      origin: request.headers.get('origin')
    });

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        operationMode: true,
        bonusPercentage: true,
        welcomeBonus: true,
        welcomeRewardType: true,
        firstPurchaseDiscountPercent: true,
        botUsername: true,
        widgetVersion: true
      }
    });

    if (!project) {
      logger.warn('Проект не найден', { projectId });
      return NextResponse.json(
        {
          success: false,
          error: 'Проект не найден'
        },
        { status: 404, headers: createCorsHeaders() }
      );
    }

    // Плашка на витрине: «до N бонусов» — берём максимальный % начисления из активных
    // уровней; если уровней нет — процент из настроек проекта (простой режим).
    const bonusLevels = await db.bonusLevel.findMany({
      where: { projectId, isActive: true },
      select: { bonusPercent: true },
      orderBy: { bonusPercent: 'desc' }
    });

    const projectAccrualPercent = Number(project.bonusPercentage);
    const fallbackFromProject = Number.isFinite(projectAccrualPercent)
      ? projectAccrualPercent
      : 10;

    const maxBonusPercent =
      bonusLevels.length > 0
        ? bonusLevels[0].bonusPercent
        : fallbackFromProject;

    logger.info('Рассчитан процент для плашки виджета', {
      projectId,
      maxBonusPercent,
      levelsCount: bonusLevels.length,
      usedProjectBonusPercentage: bonusLevels.length === 0
    });

    // Получаем настройки виджета
    const widgetSettings = await db.widgetSettings.findUnique({
      where: { projectId }
    });

    // Если настроек нет, создаём (или восстанавливаем) дефолтные
    if (!widgetSettings) {
      logger.info('Настройки виджета не найдены, проверяем legacy данные', {
        projectId
      });

      const botSettings = await db.botSettings.findUnique({
        where: { projectId },
        select: { functionalSettings: true }
      });
      const legacyWidgetSettings =
        (
          botSettings?.functionalSettings as {
            widgetSettings?: LegacyWidgetSettings;
          } | null
        )?.widgetSettings || null;
      const hasLegacySettings =
        legacyWidgetSettings && Object.keys(legacyWidgetSettings).length > 0;
      const legacy = legacyWidgetSettings ?? {};

      const defaultSettings = await db.widgetSettings.create({
        data: hasLegacySettings
          ? {
              projectId,
              registrationTitle:
                getLegacyString(legacy, 'registrationTitle') ||
                'Зарегистрируйся и получи {bonusAmount} бонусов!',
              registrationDescription:
                getLegacyString(legacy, 'registrationDescription') ||
                'Зарегистрируйся в нашей бонусной программе',
              registrationButtonText:
                getLegacyString(legacy, 'registrationButtonText') ||
                'Для участия в акции перейдите в бота',
              registrationButtonUrl:
                getLegacyString(legacy, 'registrationButtonUrl') || null,
              verificationButtonUrl:
                getLegacyString(legacy, 'verificationButtonUrl') || null,
              registrationFallbackText:
                getLegacyString(legacy, 'registrationFallbackText') ||
                'Свяжитесь с администратором для регистрации',
              showIcon: getLegacyBoolean(legacy, 'showIcon') ?? true,
              showTitle: getLegacyBoolean(legacy, 'showTitle') ?? true,
              showDescription:
                getLegacyBoolean(legacy, 'showDescription') ?? true,
              showButton: getLegacyBoolean(legacy, 'showButton') ?? true,
              showFallbackText:
                getLegacyBoolean(legacy, 'showFallbackText') ?? true,
              showPromocodeForGuests:
                getLegacyBoolean(legacy, 'showPromocodeForGuests') ?? true,
              productBadgeEnabled:
                getLegacyBoolean(legacy, 'productBadgeEnabled') ?? true,
              productBadgeShowOnCards:
                getLegacyBoolean(legacy, 'productBadgeShowOnCards') ?? true,
              productBadgeShowOnProductPage:
                getLegacyBoolean(legacy, 'productBadgeShowOnProductPage') ??
                true,
              productBadgeText:
                getLegacyString(legacy, 'productBadgeText') ||
                'Начислим до {bonusAmount} бонусов',
              productBadgeLinkUrl:
                getLegacyString(legacy, 'productBadgeLinkUrl') || null,
              productBadgeBonusPercent:
                getLegacyNumber(legacy, 'productBadgeBonusPercent') ??
                maxBonusPercent,
              productBadgePosition:
                getLegacyString(legacy, 'productBadgePosition') ||
                'after-price',
              productBadgeCustomSelector:
                getLegacyString(legacy, 'productBadgeCustomSelector') || null,
              registrationStyles: cleanObject({
                backgroundColor: getLegacyString(legacy, 'backgroundColor'),
                backgroundGradient: getLegacyString(
                  legacy,
                  'backgroundGradient'
                ),
                textColor: getLegacyString(legacy, 'textColor'),
                titleColor: getLegacyString(legacy, 'titleColor'),
                descriptionColor: getLegacyString(legacy, 'descriptionColor'),
                fallbackTextColor: getLegacyString(legacy, 'fallbackTextColor'),
                buttonTextColor: getLegacyString(legacy, 'buttonTextColor'),
                buttonBackgroundColor: getLegacyString(
                  legacy,
                  'buttonBackgroundColor'
                ),
                buttonBorderColor: getLegacyString(legacy, 'buttonBorderColor'),
                buttonHoverColor: getLegacyString(legacy, 'buttonHoverColor'),
                fallbackBackgroundColor: getLegacyString(
                  legacy,
                  'fallbackBackgroundColor'
                ),
                borderRadius: getLegacyString(legacy, 'borderRadius'),
                padding: getLegacyString(legacy, 'padding'),
                marginBottom: getLegacyString(legacy, 'marginBottom'),
                iconSize: getLegacyString(legacy, 'iconSize'),
                titleFontSize: getLegacyString(legacy, 'titleFontSize'),
                titleFontWeight: getLegacyString(legacy, 'titleFontWeight'),
                descriptionFontSize: getLegacyString(
                  legacy,
                  'descriptionFontSize'
                ),
                buttonFontSize: getLegacyString(legacy, 'buttonFontSize'),
                buttonFontWeight: getLegacyString(legacy, 'buttonFontWeight'),
                buttonPadding: getLegacyString(legacy, 'buttonPadding'),
                buttonBorderRadius: getLegacyString(
                  legacy,
                  'buttonBorderRadius'
                ),
                fallbackFontSize: getLegacyString(legacy, 'fallbackFontSize'),
                fallbackPadding: getLegacyString(legacy, 'fallbackPadding'),
                fallbackBorderRadius: getLegacyString(
                  legacy,
                  'fallbackBorderRadius'
                ),
                boxShadow: getLegacyString(legacy, 'boxShadow'),
                buttonBoxShadow: getLegacyString(legacy, 'buttonBoxShadow'),
                iconAnimation: getLegacyString(legacy, 'iconAnimation'),
                iconEmoji: getLegacyString(legacy, 'iconEmoji'),
                iconColor: getLegacyString(legacy, 'iconColor'),
                fontFamily: getLegacyString(legacy, 'fontFamily'),
                maxWidth: getLegacyString(legacy, 'maxWidth'),
                textAlign: getLegacyString(legacy, 'textAlign'),
                buttonWidth: getLegacyString(legacy, 'buttonWidth'),
                buttonDisplay: getLegacyString(legacy, 'buttonDisplay'),
                fontSize: getLegacyString(legacy, 'fontSize')
              }),
              productBadgeStyles: cleanObject({
                backgroundColor: getLegacyString(
                  legacy,
                  'productBadgeBackgroundColor'
                ),
                textColor: getLegacyString(legacy, 'productBadgeTextColor'),
                fontFamily: getLegacyString(legacy, 'productBadgeFontFamily'),
                fontSize: getLegacyString(legacy, 'productBadgeFontSize'),
                fontWeight: getLegacyString(legacy, 'productBadgeFontWeight'),
                padding: getLegacyString(legacy, 'productBadgePadding'),
                borderRadius: getLegacyString(
                  legacy,
                  'productBadgeBorderRadius'
                ),
                marginTop: getLegacyString(legacy, 'productBadgeMarginTop'),
                marginX: getLegacyString(legacy, 'productBadgeMarginX') || '0'
              }),
              widgetStyles: cleanObject({
                backgroundColor: getLegacyString(
                  legacy,
                  'widgetBackgroundColor'
                ),
                borderColor: getLegacyString(legacy, 'widgetBorderColor'),
                textColor: getLegacyString(legacy, 'widgetTextColor'),
                labelColor: getLegacyString(legacy, 'widgetLabelColor'),
                inputBackground: getLegacyString(
                  legacy,
                  'widgetInputBackground'
                ),
                inputBorder: getLegacyString(legacy, 'widgetInputBorder'),
                inputText: getLegacyString(legacy, 'widgetInputText'),
                buttonBackground: getLegacyString(
                  legacy,
                  'widgetButtonBackground'
                ),
                buttonText: getLegacyString(legacy, 'widgetButtonText'),
                buttonHover: getLegacyString(legacy, 'widgetButtonHover'),
                balanceColor: getLegacyString(legacy, 'widgetBalanceColor'),
                errorColor: getLegacyString(legacy, 'widgetErrorColor'),
                successColor: getLegacyString(legacy, 'widgetSuccessColor'),
                fontFamily: getLegacyString(legacy, 'widgetFontFamily'),
                fontSize: getLegacyString(legacy, 'widgetFontSize'),
                labelFontSize: getLegacyString(legacy, 'widgetLabelFontSize'),
                buttonFontSize: getLegacyString(legacy, 'widgetButtonFontSize'),
                balanceFontSize: getLegacyString(
                  legacy,
                  'widgetBalanceFontSize'
                ),
                borderRadius: getLegacyString(legacy, 'widgetBorderRadius'),
                padding: getLegacyString(legacy, 'widgetPadding'),
                inputBorderRadius: getLegacyString(
                  legacy,
                  'widgetInputBorderRadius'
                ),
                inputPadding: getLegacyString(legacy, 'widgetInputPadding'),
                buttonBorderRadius: getLegacyString(
                  legacy,
                  'widgetButtonBorderRadius'
                ),
                buttonPadding: getLegacyString(legacy, 'widgetButtonPadding'),
                boxShadow: getLegacyString(legacy, 'widgetBoxShadow'),
                inputBoxShadow: getLegacyString(legacy, 'widgetInputBoxShadow'),
                buttonBoxShadow: getLegacyString(
                  legacy,
                  'widgetButtonBoxShadow'
                )
              })
            }
          : {
              projectId,
              productBadgeBonusPercent: maxBonusPercent // Используем рассчитанный процент
            }
      });

      return NextResponse.json(
        {
          success: true,
          ...defaultSettings,
          // Разворачиваем стили из JSON полей
          ...((defaultSettings.registrationStyles as object) || {}),
          ...((defaultSettings.productBadgeStyles as object) || {}),
          ...((defaultSettings.widgetStyles as object) || {}),
          productBadgeBonusPercent: maxBonusPercent, // Всегда актуальный процент
          operationMode: project.operationMode,
          botUsername: project.botUsername,
          welcomeBonusAmount: Number(project.welcomeBonus),
          welcomeRewardType: project.welcomeRewardType,
          firstPurchaseDiscountPercent: project.firstPurchaseDiscountPercent,
          widgetVersion: project.widgetVersion // Добавляем версию виджета
        },
        { headers: createCorsHeaders() }
      );
    }

    // Возвращаем настройки виджета с актуальным процентом из уровней
    const response = {
      success: true,
      ...widgetSettings,
      // Разворачиваем стили из JSON полей
      ...((widgetSettings.registrationStyles as object) || {}),
      ...((widgetSettings.productBadgeStyles as object) || {}),
      ...((widgetSettings.widgetStyles as object) || {}),
      productBadgeBonusPercent: maxBonusPercent, // ВСЕГДА берём из уровней, игнорируя сохранённое значение
      // Добавляем данные из проекта
      operationMode: project.operationMode,
      botUsername: project.botUsername,
      welcomeBonusAmount: Number(project.welcomeBonus),
      welcomeRewardType: project.welcomeRewardType,
      firstPurchaseDiscountPercent: project.firstPurchaseDiscountPercent,
      widgetVersion: project.widgetVersion // Добавляем версию виджета для мониторинга
    };

    logger.info('Настройки виджета успешно загружены', {
      projectId,
      widgetVersion: project.widgetVersion,
      hasSettings: true
    });

    return NextResponse.json(response, { headers: createCorsHeaders() });
  } catch (error) {
    logger.error(
      'Ошибка получения настроек виджета',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'widget-api'
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Внутренняя ошибка сервера'
      },
      { status: 500, headers: createCorsHeaders() }
    );
  }
}

// PUT /api/projects/[id]/widget - Обновление настроек виджета (требует аутентификации)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const body = await request.json();

    logger.info('PUT /api/projects/[id]/widget запрос', {
      projectId,
      bodyKeys: Object.keys(body)
    });

    // Проверяем существование проекта
    const project = await db.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 });
    }

    // Разделяем поля на основные и стили
    const {
      // Стили регистрации
      backgroundColor,
      backgroundGradient,
      textColor,
      titleColor,
      descriptionColor,
      fallbackTextColor,
      buttonTextColor,
      buttonBackgroundColor,
      buttonBorderColor,
      buttonHoverColor,
      fallbackBackgroundColor,
      borderRadius,
      padding,
      marginBottom,
      iconSize,
      titleFontSize,
      titleFontWeight,
      descriptionFontSize,
      buttonFontSize,
      buttonFontWeight,
      buttonPadding,
      buttonBorderRadius,
      fallbackFontSize,
      fallbackPadding,
      fallbackBorderRadius,
      boxShadow,
      buttonBoxShadow,
      iconAnimation,
      iconEmoji,
      iconColor,
      fontFamily,
      maxWidth,
      textAlign,
      buttonWidth,
      buttonDisplay,
      fontSize,

      // Стили бейджей товаров
      productBadgeBackgroundColor,
      productBadgeTextColor,
      productBadgeFontFamily,
      productBadgeFontSize,
      productBadgeFontWeight,
      productBadgePadding,
      productBadgeBorderRadius,
      productBadgeMarginTop,
      productBadgeMarginX,

      // Стили виджета
      widgetBackgroundColor,
      widgetBorderColor,
      widgetTextColor,
      widgetLabelColor,
      widgetInputBackground,
      widgetInputBorder,
      widgetInputText,
      widgetButtonBackground,
      widgetButtonText,
      widgetButtonHover,
      widgetBalanceColor,
      widgetErrorColor,
      widgetSuccessColor,
      widgetFontFamily,
      widgetFontSize,
      widgetLabelFontSize,
      widgetButtonFontSize,
      widgetBalanceFontSize,
      widgetBorderRadius,
      widgetPadding,
      widgetInputBorderRadius,
      widgetInputPadding,
      widgetButtonBorderRadius,
      widgetButtonPadding,
      widgetBoxShadow,
      widgetInputBoxShadow,
      widgetButtonBoxShadow,

      ...mainFields
    } = body;

    // Группируем стили в JSON объекты
    const registrationStyles = {
      backgroundColor,
      backgroundGradient,
      textColor,
      titleColor,
      descriptionColor,
      fallbackTextColor,
      buttonTextColor,
      buttonBackgroundColor,
      buttonBorderColor,
      buttonHoverColor,
      fallbackBackgroundColor,
      borderRadius,
      padding,
      marginBottom,
      iconSize,
      titleFontSize,
      titleFontWeight,
      descriptionFontSize,
      buttonFontSize,
      buttonFontWeight,
      buttonPadding,
      buttonBorderRadius,
      fallbackFontSize,
      fallbackPadding,
      fallbackBorderRadius,
      boxShadow,
      buttonBoxShadow,
      iconAnimation,
      iconEmoji,
      iconColor,
      fontFamily,
      maxWidth,
      textAlign,
      buttonWidth,
      buttonDisplay,
      fontSize
    };

    const productBadgeStyles = {
      productBadgeBackgroundColor,
      productBadgeTextColor,
      productBadgeFontFamily,
      productBadgeFontSize,
      productBadgeFontWeight,
      productBadgePadding,
      productBadgeBorderRadius,
      productBadgeMarginTop,
      productBadgeMarginX
    };

    const widgetStyles = {
      widgetBackgroundColor,
      widgetBorderColor,
      widgetTextColor,
      widgetLabelColor,
      widgetInputBackground,
      widgetInputBorder,
      widgetInputText,
      widgetButtonBackground,
      widgetButtonText,
      widgetButtonHover,
      widgetBalanceColor,
      widgetErrorColor,
      widgetSuccessColor,
      widgetFontFamily,
      widgetFontSize,
      widgetLabelFontSize,
      widgetButtonFontSize,
      widgetBalanceFontSize,
      widgetBorderRadius,
      widgetPadding,
      widgetInputBorderRadius,
      widgetInputPadding,
      widgetButtonBorderRadius,
      widgetButtonPadding,
      widgetBoxShadow,
      widgetInputBoxShadow,
      widgetButtonBoxShadow
    };

    // Удаляем undefined значения
    const cleanRegistrationStyles = Object.fromEntries(
      Object.entries(registrationStyles).filter(
        ([_, value]) => value !== undefined
      )
    );
    const cleanProductBadgeStyles = Object.fromEntries(
      Object.entries(productBadgeStyles).filter(
        ([_, value]) => value !== undefined
      )
    );
    const cleanWidgetStyles = Object.fromEntries(
      Object.entries(widgetStyles).filter(([_, value]) => value !== undefined)
    );

    // Подготавливаем данные для сохранения
    const updateData = {
      ...mainFields,
      ...(Object.keys(cleanRegistrationStyles).length > 0 && {
        registrationStyles: cleanRegistrationStyles
      }),
      ...(Object.keys(cleanProductBadgeStyles).length > 0 && {
        productBadgeStyles: cleanProductBadgeStyles
      }),
      ...(Object.keys(cleanWidgetStyles).length > 0 && {
        widgetStyles: cleanWidgetStyles
      })
    };

    // Обновляем или создаём настройки виджета
    const widgetSettings = await db.widgetSettings.upsert({
      where: { projectId },
      create: {
        projectId,
        ...updateData
      },
      update: updateData
    });

    logger.info('Настройки виджета обновлены', { projectId });

    return NextResponse.json({
      success: true,
      ...widgetSettings
    });
  } catch (error) {
    logger.error(
      'Ошибка обновления настроек виджета',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'widget-api'
    );
    return NextResponse.json(
      { error: 'Ошибка обновления настроек виджета' },
      { status: 500 }
    );
  }
}
