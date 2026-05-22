/**
 * @file: tilda-adapter.js
 * @description: Адаптер для интеграции виджета с платформой Tilda
 * @implements: IWidgetAdapter
 * @version: 3.0.0
 * @status: 🚧 В разработке (не используется в production)
 * @project: SaaS Bonus System - Universal Widget
 *
 * АРХИТЕКТУРА:
 * - Изолирует всю Tilda-специфичную логику от ядра виджета
 * - Реализует паттерн Adapter для мультиплатформенности
 * - Предоставляет унифицированный API для работы с платформой
 *
 * ИНТЕРФЕЙС IWidgetAdapter:
 * - init(): void
 * - getCartTotal(): number
 * - getContactInfo(): {email, phone}
 * - applyPromocode(code): Promise<boolean>
 * - observeCart(): void
 * - observeUserInput(): void
 * - initProductBadges(settings, calculatorFn): void
 * - mountInlineWidget(renderCallback): void
 * - destroy(): void
 */

(function () {
  'use strict';

  class TildaAdapter {
    constructor(core) {
      this.core = core;
      this.observers = new Set();
      this.promoHiddenClass = 'bonus-promocode-hidden';
      this.originalPromoStyles = null;
      this.lastCartTotal = 0;
      this.debounceTimers = new Map();
      this.badgeSettings = null;
      this.calculateBonus = null;
    }

    /**
     * ========================================
     * ОБЯЗАТЕЛЬНЫЕ МЕТОДЫ ИНТЕРФЕЙСА
     * ========================================
     */

    /**
     * Инициализация адаптера
     */
    init() {
      this.log('✅ TildaAdapter: Инициализация');

      // Проверяем что мы на Tilda
      if (!this.isTildaPlatform()) {
        console.warn('⚠️ TildaAdapter: Не обнаружена платформа Tilda');
        return;
      }

      // Захватываем стили промокода до любых манипуляций
      const promoWrapper = document.querySelector('.t-inputpromocode__wrapper');
      if (promoWrapper) {
        this.capturePromoStyles(promoWrapper);
      }

      this.log('✅ TildaAdapter: Инициализирован');
    }

    /**
     * Получить текущую сумму корзины
     * @returns {number}
     */
    getCartTotal() {
      try {
        const totalEl = document.querySelector('.t706__cartwin-totalamount');
        if (!totalEl) return 0;

        // Удаляем символы валюты и все кроме цифр и разделителей
        let cleanText = totalEl.textContent.replace(/[^\d.,]/g, '');
        // Заменяем запятую на точку если нужно
        cleanText = cleanText.replace(',', '.');

        return parseFloat(cleanText) || 0;
      } catch (e) {
        console.warn('Ошибка парсинга суммы корзины:', e);
        return 0;
      }
    }

    /**
     * Получить контакты пользователя из полей ввода
     * @returns {{email: string|null, phone: string|null}}
     */
    getContactInfo() {
      let email = null;
      let phone = null;

      // Пробуем найти поля Tilda
      const emailInputs = document.querySelectorAll(
        'input[name="email"], input[type="email"], .t-input-group_email input'
      );
      for (const input of emailInputs) {
        if (input.value && input.value.includes('@')) {
          email = input.value.trim();
          break;
        }
      }

      const phoneInputs = document.querySelectorAll(
        'input[name="phone"], input[type="tel"], .t-input-group_phone input'
      );
      for (const input of phoneInputs) {
        // Базовая валидация (минимум 10 цифр)
        const digits = input.value.replace(/\D/g, '');
        if (digits.length >= 10) {
          phone = input.value.trim();
          break;
        }
      }

      return { email, phone };
    }

    /**
     * Очистка ресурсов при уничтожении
     */
    destroy() {
      this.log('🧹 TildaAdapter: Очистка ресурсов');

      // Отключаем всех observers
      this.observers.forEach((obs) => obs.disconnect());
      this.observers.clear();

      // Очищаем таймеры
      this.debounceTimers.forEach((timer) => clearTimeout(timer));
      this.debounceTimers.clear();

      // Восстанавливаем поле промокода если скрывали
      const promoWrapper = document.querySelector('.t-inputpromocode__wrapper');
      if (promoWrapper) {
        this.showTildaPromocodeField(promoWrapper);
      }

      this.log('✅ TildaAdapter: Ресурсы очищены');
    }

    /**
     * ========================================
     * ОПЦИОНАЛЬНЫЕ МЕТОДЫ ИНТЕРФЕЙСА
     * ========================================
     */

    /**
     * Применить промокод к корзине
     * @param {string} code - Промокод для применения
     * @returns {Promise<boolean>}
     */
    async applyPromocode(code) {
      const input = document.querySelector('.t-inputpromocode');
      const btn = document.querySelector('.t-inputpromocode__btn');

      if (input && btn) {
        input.value = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Небольшая задержка перед кликом
        await new Promise((resolve) => setTimeout(resolve, 100));

        btn.click();

        this.log(`✅ Промокод "${code}" применен`);
        return true;
      }

      this.log(`⚠️ Не удалось применить промокод "${code}"`);
      return false;
    }

    /**
     * Скрыть или показать нативное поле промокода
     * @param {boolean} hidden
     */
    setPromocodeFieldVisibility(hidden) {
      const wrappers = document.querySelectorAll(
        '.t-inputpromocode__wrapper, .t-promocode__wrapper, .t-inputpromocode__container, .t-promocode__container, .t706__cartwin-promocode, .t706__promocode'
      );
      const messages = document.querySelectorAll(
        '.t-inputpromocode__message, .t-inputpromocode__applied-text, .t-promocode__message, .t-promocode__applied-text'
      );

      if (hidden) {
        wrappers.forEach((el) => this.hideTildaPromocodeField(el));
        messages.forEach((el) => this.hideTildaPromocodeField(el));
      } else {
        wrappers.forEach((el) => this.showTildaPromocodeField(el));
        messages.forEach((el) => this.showTildaPromocodeField(el));
      }
    }

    /**
     * Отслеживание изменений корзины с debounce
     */
    observeCart() {
      const cartWin = document.querySelector('.t706__cartwin');
      if (!cartWin) {
        this.log('⚠️ Корзина Tilda не найдена');
        return;
      }

      let debounceTimer = null;

      const observer = new MutationObserver((mutations) => {
        // Debounce для оптимизации
        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
          const newTotal = this.getCartTotal();

          // Проверяем реальное изменение
          if (this.lastCartTotal !== newTotal) {
            this.log(
              `📊 Корзина изменилась: ${this.lastCartTotal} → ${newTotal}`
            );
            this.lastCartTotal = newTotal;
            this.core.onPlatformCartUpdate(newTotal);
          }
        }, 400); // 400ms debounce
      });

      observer.observe(cartWin, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class', 'data-total']
      });

      this.observers.add(observer);
      this.log('✅ Observer корзины запущен');
    }

    /**
     * Отслеживание ввода пользователя с debounce и валидацией
     */
    observeUserInput() {
      const handleInput = (e) => {
        const target = e.target;
        if (target.tagName !== 'INPUT') return;

        const type = target.type;
        const name = target.name;
        const value = target.value;

        // Определяем тип поля
        let fieldType = null;
        if (type === 'email' || name === 'email' || name.includes('email')) {
          fieldType = 'email';
        } else if (
          type === 'tel' ||
          name === 'phone' ||
          name.includes('phone')
        ) {
          fieldType = 'phone';
        }

        if (!fieldType) return;

        // Debounce для каждого типа поля
        if (this.debounceTimers.has(fieldType)) {
          clearTimeout(this.debounceTimers.get(fieldType));
        }

        this.debounceTimers.set(
          fieldType,
          setTimeout(() => {
            // Валидация перед отправкой
            if (fieldType === 'email' && !this.validateEmail(value)) return;
            if (fieldType === 'phone' && !this.validatePhone(value)) return;

            this.log(`📝 Пользователь ввел ${fieldType}:`, value);
            this.core.onUserDataUpdate({ [fieldType]: value });
          }, 500)
        ); // 500ms debounce
      };

      document.addEventListener('input', handleInput, { passive: true });
      document.addEventListener('change', handleInput, { passive: true });

      this.log('✅ Observer ввода пользователя запущен');
    }

    /**
     * Инициализация бонусных плашек на товарах
     * @param {object} settings - Настройки виджета
     * @param {Function} calculatorFn - Функция расчета бонусов (из ядра)
     */
    initProductBadges(settings, calculatorFn) {
      if (settings.productBadgeEnabled === false) {
        this.log('ℹ️ Бонусные плашки отключены');
        return;
      }

      this.badgeSettings = settings;
      this.calculateBonus = calculatorFn;

      // Инъекция стилей
      this.injectBadgeStyles(settings);

      // Добавление плашек на существующие товары
      this.addBadgesToAllProducts();

      // Наблюдатель за динамической подгрузкой товаров
      this.observeProductChanges();

      this.log('✅ Бонусные плашки инициализированы');
    }

    /**
     * Монтирование инлайн-виджета в структуру страницы
     * @param {function} renderCallback - Функция рендера из ядра, принимает контейнер
     */
    mountInlineWidget(renderCallback) {
      const promoWrapper = document.querySelector('.t-inputpromocode__wrapper');

      if (!promoWrapper) {
        this.log('⚠️ Поле промокода Tilda не найдено');
        return;
      }

      // Скрываем нативное поле промокода
      this.setPromocodeFieldVisibility(true);

      // Создаем или находим контейнер
      let container = document.querySelector('.lw-inline-widget-container');

      if (!container) {
        container = document.createElement('div');
        container.className = 'lw-inline-widget-container';
        container.style.cssText = 'margin-bottom: 12px;';

        // Вставляем ПЕРЕД полем промокода
        promoWrapper.parentNode.insertBefore(container, promoWrapper);

        this.log('✅ Контейнер виджета создан');
      }

      // Вызываем callback рендера из Core
      renderCallback(container);

      this.log('✅ Инлайн виджет смонтирован');
    }

    /**
     * ========================================
     * ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ РАБОТЫ С TILDA
     * ========================================
     */

    /**
     * Получить объект корзины Tilda
     * @returns {object|null}
     */
    getTildaCart() {
      return window.tcart || null;
    }

    /**
     * Получить товары в корзине
     * @returns {Array<{id, name, price, quantity, img}>}
     */
    getCartItems() {
      const cart = this.getTildaCart();
      if (!cart || !cart.products) return [];

      return cart.products.map((product) => ({
        id: product.uid || product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity),
        img: product.img
      }));
    }

    /**
     * Получить текущий промокод
     * @returns {string|null}
     */
    getCurrentPromocode() {
      const input = document.querySelector('.t-inputpromocode');
      return input ? input.value : null;
    }

    /**
     * Очистить промокод
     */
    clearPromocode() {
      // Кликаем нативные кнопки очистки
      const cleanButtons = document.querySelectorAll(
        '.t-inputpromocode__button-clean, .t-promocode__button-clean, .t-promocode__btn-clean, [class*="button-clean"], [class*="btn-clean"]'
      );
      cleanButtons.forEach((btn) => {
        if (btn && typeof btn.click === 'function') {
          try {
            btn.click();
            this.log('Нажата нативная кнопка очистки промокода Tilda');
          } catch (e) {
            this.log('Ошибка при нажатии кнопки очистки промокода:', e);
          }
        }
      });

      // Очищаем инпуты
      const inputs = document.querySelectorAll(
        '.t-inputpromocode, input[name="promocode"], input[name="promo"], .t-promocode__input, #promocode, #promo'
      );
      inputs.forEach((input) => {
        if (input) {
          input.value = '';
          try {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } catch (_) {}
        }
      });

      // Удаляем из window.tcart и вложенных объектов
      if (window.tcart) {
        const promoToClear = [
          'promocode',
          'promo',
          'discount',
          'discountvalue',
          'procdiscount',
          'discountpercent',
          'discountsum'
        ];

        const clearObjectProps = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          promoToClear.forEach((prop) => {
            if (prop in obj) {
              try {
                delete obj[prop];
              } catch (_) {}
            }
          });
          const subKeys = ['data', 'formData', 'order', 'orderData'];
          subKeys.forEach((key) => {
            if (obj[key] && typeof obj[key] === 'object') {
              clearObjectProps(obj[key]);
            }
          });
        };

        clearObjectProps(window.tcart);
      }

      // Пересчитываем скидки и обновляем
      if (typeof window.tcart__calcAmountWithDiscounts === 'function') {
        try {
          window.tcart__calcAmountWithDiscounts();
        } catch (_) {}
      }
      if (typeof window.tcart__reDrawTotal === 'function') {
        try {
          window.tcart__reDrawTotal();
        } catch (_) {}
      }
      if (typeof window.tcart__updateTotalProductsinCartObj === 'function') {
        try {
          window.tcart__updateTotalProductsinCartObj();
        } catch (_) {}
      }
    }

    /**
     * Проверить применен ли промокод
     * @returns {boolean}
     */
    isPromocodeApplied() {
      const wrapper = document.querySelector('.t-inputpromocode__wrapper');
      return wrapper && wrapper.classList.contains('t-inputpromocode_applied');
    }

    /**
     * Получить форму оформления
     * @returns {HTMLFormElement|null}
     */
    getCheckoutForm() {
      return (
        document.querySelector('.t706__cartwin-bottom form') ||
        document.querySelector('.t-form[data-form-type="order"]')
      );
    }

    /**
     * Заполнить поле формы
     * @param {string} name - Имя поля
     * @param {string} value - Значение
     * @returns {boolean}
     */
    fillFormField(name, value) {
      const form = this.getCheckoutForm();
      if (!form) return false;

      const input =
        form.querySelector(`input[name="${name}"]`) ||
        form.querySelector(`input[data-tilda-rule="${name}"]`);

      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }

    /**
     * Получить данные формы
     * @returns {object}
     */
    getFormData() {
      const form = this.getCheckoutForm();
      if (!form) return {};

      const formData = new FormData(form);
      const data = {};

      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      return data;
    }

    /**
     * Получить цену товара из элемента
     * @param {HTMLElement} element
     * @returns {number}
     */
    getProductPrice(element) {
      const priceEl =
        element.querySelector('.js-product-price') ||
        element.querySelector('.t-store__card__price-value') ||
        element.querySelector('.t776__price-value') ||
        element.querySelector('.t754__price-value');

      if (!priceEl) return 0;

      const priceText = priceEl.textContent
        .replace(/[^\d.,]/g, '')
        .replace(',', '.');
      return parseFloat(priceText) || 0;
    }

    /**
     * Получить ID товара
     * @param {HTMLElement} element
     * @returns {string|null}
     */
    getProductId(element) {
      return (
        element.dataset.productId ||
        element.dataset.uid ||
        element.querySelector('[data-product-id]')?.dataset.productId ||
        null
      );
    }

    /**
     * Получить название товара
     * @param {HTMLElement} element
     * @returns {string}
     */
    getProductName(element) {
      const nameEl =
        element.querySelector('.js-product-name') ||
        element.querySelector('.t-store__card__title') ||
        element.querySelector('.t776__title') ||
        element.querySelector('.t754__title');

      return nameEl ? nameEl.textContent.trim() : '';
    }

    /**
     * Получить все товары на странице
     * @returns {Array<{element, id, name, price}>}
     */
    getAllProducts() {
      const selectors = [
        '.js-product',
        '.t-store__card',
        '.t776__col',
        '.t754__col'
      ];

      const products = [];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          products.push({
            element: element,
            id: this.getProductId(element),
            name: this.getProductName(element),
            price: this.getProductPrice(element)
          });
        });
      });

      return products;
    }

    /**
     * ========================================
     * ВНУТРЕННИЕ МЕТОДЫ (PRIVATE)
     * ========================================
     */

    /**
     * Проверить что мы на платформе Tilda
     * @returns {boolean}
     */
    isTildaPlatform() {
      return (
        typeof window.tcart !== 'undefined' ||
        typeof window.t_store !== 'undefined' ||
        document.querySelector('.t-records') !== null
      );
    }

    /**
     * Захватить оригинальные стили поля промокода
     * @param {HTMLElement} wrapper
     */
    capturePromoStyles(element) {
      if (!element) return;
      if (element._originalStyle !== undefined) return;

      try {
        element._originalStyle = element.getAttribute('style') || '';
        this.log('✅ Сохранены оригинальные стили элемента промокода');
      } catch (error) {
        console.warn('⚠️ Ошибка сохранения стилей:', error);
      }
    }

    /**
     * Скрыть поле промокода Tilda
     * @param {HTMLElement} element
     */
    hideTildaPromocodeField(element) {
      if (!element) return;

      this.capturePromoStyles(element);
      if (!element.classList.contains(this.promoHiddenClass)) {
        element.classList.add(this.promoHiddenClass);
        element.setAttribute('aria-hidden', 'true');
      }
      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');

      this.log('✅ Элемент промокода скрыт');
    }

    /**
     * Показать поле промокода Tilda
     * @param {HTMLElement} element
     */
    showTildaPromocodeField(element) {
      if (!element) return;

      if (element.classList.contains(this.promoHiddenClass)) {
        element.classList.remove(this.promoHiddenClass);
        element.removeAttribute('aria-hidden');
      }

      if (element._originalStyle !== undefined) {
        if (element._originalStyle) {
          element.setAttribute('style', element._originalStyle);
        } else {
          element.removeAttribute('style');
        }
      } else {
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
      }

      this.log('✅ Элемент промокода показан');
    }

    /**
     * Валидация email
     * @param {string} email
     * @returns {boolean}
     */
    validateEmail(email) {
      if (!email || typeof email !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) && email.length <= 254;
    }

    /**
     * Валидация телефона
     * @param {string} phone
     * @returns {boolean}
     */
    validatePhone(phone) {
      if (!phone || typeof phone !== 'string') return false;
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }

    /**
     * Инъекция CSS стилей для плашек
     * @param {object} settings
     */
    injectBadgeStyles(settings) {
      if (document.getElementById('lw-badge-styles')) return;

      const style = document.createElement('style');
      style.id = 'lw-badge-styles';
      style.textContent = `
        .lw-bonus-badge {
          background-color: ${settings.productBadgeBackgroundColor || '#f1f1f1'};
          color: ${settings.productBadgeTextColor || '#000000'};
          font-size: ${settings.productBadgeFontSize || '14px'};
          padding: ${settings.productBadgePadding || '5px 10px'};
          border-radius: ${settings.productBadgeBorderRadius || '5px'};
          margin-top: 5px;
          margin-left: ${settings.productBadgeMarginX || '0'};
          margin-right: ${settings.productBadgeMarginX || '0'};
          display: block;
          font-family: inherit;
          line-height: 1.4;
        }
      `;
      document.head.appendChild(style);

      this.log('✅ Стили плашек добавлены');
    }

    /**
     * Добавление плашек на все товары
     */
    addBadgesToAllProducts() {
      const products = this.getAllProducts();
      let addedCount = 0;

      products.forEach((product) => {
        if (product.element.dataset.lwBadgeAdded) return;

        const bonus = this.calculateBonus(product.price);
        if (bonus <= 0) return;

        if (this.addBadgeToProduct(product.element, bonus)) {
          addedCount++;
        }
      });

      this.log(
        `✅ Добавлено плашек: ${addedCount} из ${products.length} товаров`
      );
    }

    /**
     * Добавление плашки на конкретный товар
     * @param {HTMLElement} element
     * @param {number} bonusAmount
     * @returns {boolean}
     */
    addBadgeToProduct(element, bonusAmount) {
      const priceWrapper =
        element.querySelector('.js-store-price-wrapper') ||
        element.querySelector('.t-store__card__price') ||
        element.querySelector('.t776__price') ||
        element.querySelector('.t754__price');

      if (!priceWrapper) return false;

      const badge = this.createBadgeElement(bonusAmount);

      // Вставляем ПОСЛЕ обертки цены
      priceWrapper.parentNode.insertBefore(badge, priceWrapper.nextSibling);

      element.dataset.lwBadgeAdded = 'true';
      return true;
    }

    /**
     * Создание элемента плашки
     * @param {number} bonusAmount
     * @returns {HTMLElement}
     */
    createBadgeElement(bonusAmount) {
      const badge = document.createElement('div');
      badge.className = 'lw-bonus-badge';

      const text = (
        this.badgeSettings.productBadgeText ||
        'Начислим до {bonusAmount} бонусов'
      ).replace('{bonusAmount}', bonusAmount);

      badge.textContent = text;

      return badge;
    }

    /**
     * Наблюдатель за изменениями товаров
     */
    observeProductChanges() {
      const container = document.querySelector('.t-records') || document.body;

      const observer = new MutationObserver((mutations) => {
        // Проверяем добавились ли новые товары
        let hasNewProducts = false;

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              // Element node
              const selectors = [
                '.js-product',
                '.t-store__card',
                '.t776__col',
                '.t754__col'
              ];
              const isProduct = selectors.some(
                (sel) => node.matches && node.matches(sel)
              );
              const hasProducts = selectors.some(
                (sel) => node.querySelector && node.querySelector(sel)
              );

              if (isProduct || hasProducts) {
                hasNewProducts = true;
              }
            }
          });
        });

        if (hasNewProducts) {
          this.log('🔄 Обнаружены новые товары, добавляем плашки');
          this.addBadgesToAllProducts();
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true
      });

      this.observers.add(observer);
      this.log('✅ Observer товаров запущен');
    }

    /**
     * Логирование (только если Core включил debug)
     * @param {...any} args
     */
    log(...args) {
      if (this.core && this.core.config && this.core.config.debug) {
        console.log('[TildaAdapter]', ...args);
      }
    }
  }

  // Экспорт в глобальную область видимости
  window.TildaAdapter = TildaAdapter;
})();
