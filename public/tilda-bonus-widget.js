/**
 * @file: tilda-bonus-widget.js
 * @description: Готовый виджет для интеграции бонусной системы с Tilda
 * @project: SaaS Bonus System
 * @version: 1.0.0
 * @author: AI Assistant + User
 */

(function () {
  'use strict';

  // Глобальный объект для виджета
  window.TildaBonusWidget = {
    // Конфигурация по умолчанию
    config: {
      projectId: null,
      apiUrl: 'https://bonus.example.com',
      bonusToRuble: 1,
      minOrderAmount: 100,
      debug: false,
      debounceMs: 400
    },

    // Состояние
    state: {
      userEmail: null,
      userPhone: null,
      bonusBalance: 0,
      appliedBonuses: 0,
      initialized: false,
      balanceDebounceTimer: null,
      activeFetchController: null,
      cartOpenDebounceTimer: null,
      _bodyObserver: null,
      _cartObserver: null,
      mode: 'bonus'
    },

    // Инициализация виджета
    init: function (userConfig) {
      // Объединяем конфигурацию
      this.config = Object.assign({}, this.config, userConfig);

      // Проверяем обязательные параметры
      if (!this.config.projectId) {
        console.error('[TildaBonusWidget] Ошибка: projectId не указан');
        return;
      }

      // Инициализируем UI
      this.initUI();

      // Отслеживаем изменения в корзине
      this.observeCart();

      // Отслеживаем ввод email/телефона
      this.observeUserInput();

      this.state.initialized = true;
      this.log('Виджет инициализирован', this.config);
    },

    // Логирование (только в debug режиме)
    log: function () {
      if (this.config.debug) {
        console.log('[TildaBonusWidget]', ...arguments);
      }
    },

    // Создание UI элементов
    initUI: function () {
      // Стили для виджета
      const style = document.createElement('style');
      style.textContent = `
        .bonus-widget-container {
          background: #fff;
          border: 1px solid #000;
          border-radius: 10px;
          padding: 12px;
          margin: 8px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #000;
        }
        
        .bonus-widget-title {
          font-size: 16px;
          font-weight: 600;
          color: #000;
          margin-bottom: 8px;
        }
        .bonus-toggle{display:flex;gap:8px;margin-bottom:8px}
        .bonus-toggle-btn{flex:1;padding:8px 12px;border:1px solid #000;background:#fff;border-radius:8px;cursor:pointer;color:#000}
        .bonus-toggle-btn.active{background:#000;color:#fff}
        
        .bonus-balance { font-size: 13px; color: #000; margin-bottom: 8px; }
        
        .bonus-balance-amount { font-weight: 600; }
        
        .bonus-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .bonus-input { flex: 1; padding: 10px 12px; border: 1px solid #000; border-radius: 8px; font-size: 14px; color:#000 }
        
        .bonus-button { padding: 10px 16px; background:#000; color:#fff; border:1px solid #000; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; transition: background .2s }
        .bonus-button:hover { background:#222 }
        .bonus-button:disabled { opacity:.6; cursor:not-allowed }
        
        .bonus-applied { padding:8px 12px; border:1px solid #000; border-radius:8px; color:#000; background:#fff; font-size:13px }
        .bonus-error { padding:8px 12px; border:1px solid #000; border-radius:8px; color:#000; background:#fff; font-size:13px; margin-top:8px }
        
        .bonus-loading {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #007bff;
          border-radius: 50%;
          animation: bonus-spin 1s linear infinite;
          margin-left: 8px;
        }
        
        @keyframes bonus-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
      // Контейнер создаём лениво — только когда пользователь найден
    },

    // Создание виджета
    createWidget: function () {
      // Не вставляем повторно
      if (document.querySelector('.bonus-widget-container')) {
        this.log('Виджет уже добавлен, пропускаем');
        return;
      }
      const container = document.createElement('div');
      container.className = 'bonus-widget-container';
      container.innerHTML = `
        <div class="bonus-widget-title">Бонусная программа</div>
        <div class="bonus-toggle">
          <button id="bonus-tab" type="button" class="bonus-toggle-btn active" onclick="TildaBonusWidget.switchMode('bonus')">Списать бонусы</button>
          <button id="promo-tab" type="button" class="bonus-toggle-btn" onclick="TildaBonusWidget.switchMode('promo')">Промокод</button>
        </div>
        <div class="bonus-balance" style="display: none;">
          Ваш баланс: <span class="bonus-balance-amount">0</span> бонусов
        </div>
        <div id="bonus-section" class="bonus-input-group">
          <input type="number" 
                 class="bonus-input" 
                 id="bonus-amount-input" 
                 placeholder="Количество бонусов" 
                 min="0"
                 style="display: none;">
          <button class="bonus-button" type="button"
                  id="apply-bonus-button" 
                  onclick="TildaBonusWidget.applyBonuses()"
                  style="display: none;">
            Применить бонусы
          </button>
        </div>
        <!-- Стандартный блок промокода Тильды будет показан/скрыт переключателем -->
        <div id="bonus-status"></div>
      `;

      // Вставляем рядом со стандартным инпутом промокода, если он есть
      const insertPoint = (function () {
        var w = document.querySelector('.t-inputpromocode__wrapper');
        if (w) return w;
        return TildaBonusWidget.findInsertPoint();
      })();
      if (insertPoint) {
        insertPoint.parentNode.insertBefore(container, insertPoint);
        this.log('Виджет добавлен на страницу');
      } else {
        this.log('Не удалось найти место для виджета');
      }

      try {
        this.state.promoWrapper = document.querySelector(
          '.t-inputpromocode__wrapper'
        );
      } catch (_) {}
    },

    // Гарантированно вставить виджет, если его ещё нет
    ensureWidgetMounted: function () {
      if (!document.querySelector('.bonus-widget-container')) {
        this.createWidget();
      }
      return !!document.querySelector('.bonus-widget-container');
    },

    // Полностью скрыть/удалить виджет, если пользователь не найден/не авторизован
    removeWidget: function () {
      const container = document.querySelector('.bonus-widget-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        this.log('Виджет удалён (пользователь не найден)');
      }
    },

    // Поиск места для вставки виджета
    findInsertPoint: function () {
      // Ищем блок с итоговой суммой или кнопку оформления
      const selectors = [
        '.t706__cartwin-promocode',
        '.t706__promocode',
        '.t706__cartwin-totalamount',
        '.t706__cartwin-bottom',
        '.t-form__submit',
        '[href*="tilda.cc/rec"]'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
      }

      return null;
    },

    // Наблюдение за корзиной (без тяжёлого отслеживания style по всему документу)
    observeCart: function () {
      const attachCartObserver = () => {
        const cartWindow = document.querySelector('.t706__cartwin');
        if (!cartWindow) return false;
        const onChange = () => {
          const isOpen = cartWindow.style.display !== 'none';
          if (isOpen) this.onCartOpenDebounced();
        };
        // первичная проверка состояния
        onChange();
        this.state._cartObserver = new MutationObserver(onChange);
        this.state._cartObserver.observe(cartWindow, {
          attributes: true,
          attributeFilter: ['style']
        });
        return true;
      };

      if (!attachCartObserver()) {
        this.state._bodyObserver = new MutationObserver(() => {
          if (attachCartObserver() && this.state._bodyObserver) {
            this.state._bodyObserver.disconnect();
            this.state._bodyObserver = null;
          }
        });
        this.state._bodyObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    },

    onCartOpenDebounced: function () {
      if (this.state.cartOpenDebounceTimer)
        clearTimeout(this.state.cartOpenDebounceTimer);
      this.state.cartOpenDebounceTimer = setTimeout(() => {
        try {
          this.onCartOpen();
        } catch (e) {
          this.log('onCartOpen error', e);
        }
      }, 250);
    },

    // Обработка открытия корзины
    onCartOpen: function () {
      this.log('Корзина открыта');

      // Получаем email/телефон пользователя
      const userContact = this.getUserContact();
      if (userContact) {
        this.loadUserBalance(userContact);
      }
    },

    // Переключение режима: бонусы | промокод
    switchMode: function (mode) {
      this.state.mode = mode === 'promo' ? 'promo' : 'bonus';
      var bonusTab = document.getElementById('bonus-tab');
      var promoTab = document.getElementById('promo-tab');
      var bonusSection = document.getElementById('bonus-section');
      if (!bonusTab || !promoTab || !bonusSection) return;
      if (this.state.mode === 'promo') {
        bonusTab.classList.remove('active');
        promoTab.classList.add('active');
        bonusSection.style.display = 'none';
        var w =
          this.state.promoWrapper ||
          document.querySelector('.t-inputpromocode__wrapper');
        if (w) w.style.display = 'table';
      } else {
        promoTab.classList.remove('active');
        bonusTab.classList.add('active');
        var w2 =
          this.state.promoWrapper ||
          document.querySelector('.t-inputpromocode__wrapper');
        if (w2) w2.style.display = 'none';
        bonusSection.style.display = 'flex';
      }
      // Переключение режима всегда сбрасывает ранее применённые бонусы/визуальные изменения
      this.resetAppliedBonuses();
    },

    // Наблюдение за вводом пользователя
    observeUserInput: function () {
      // Отслеживаем изменения в полях email и телефона
      document.addEventListener('input', (e) => {
        if (
          e.target.type === 'email' ||
          e.target.name === 'email' ||
          e.target.type === 'tel' ||
          e.target.name === 'phone'
        ) {
          this.onUserInputChange(e.target);
        }
      });
    },

    // Обработка изменения данных пользователя
    onUserInputChange: function (input) {
      const value = input.value.trim();
      if (!value) return;

      if (input.type === 'email' || input.name === 'email') {
        this.state.userEmail = value;
        localStorage.setItem('tilda_user_email', value);
      } else if (input.type === 'tel' || input.name === 'phone') {
        this.state.userPhone = value;
        localStorage.setItem('tilda_user_phone', value);
      }

      // Загружаем баланс с дебаунсом
      this.loadUserBalanceDebounced({
        email: this.state.userEmail,
        phone: this.state.userPhone
      });
    },

    // Получение контактов пользователя
    getUserContact: function () {
      // Из localStorage
      const savedEmail = localStorage.getItem('tilda_user_email');
      const savedPhone = localStorage.getItem('tilda_user_phone');

      if (savedEmail || savedPhone) {
        return { email: savedEmail, phone: savedPhone };
      }

      // Из полей формы
      const emailField = document.querySelector(
        'input[name="email"], input[type="email"]'
      );
      const phoneField = document.querySelector(
        'input[name="phone"], input[type="tel"]'
      );

      const email = emailField ? emailField.value : null;
      const phone = phoneField ? phoneField.value : null;

      if (email || phone) {
        return { email, phone };
      }

      return null;
    },

    // Дебаунс-обёртка для загрузки баланса
    loadUserBalanceDebounced: function (contact) {
      if (this.state.balanceDebounceTimer) {
        clearTimeout(this.state.balanceDebounceTimer);
      }
      this.state.balanceDebounceTimer = setTimeout(() => {
        this.loadUserBalance(contact);
      }, this.config.debounceMs);
    },

    // Загрузка баланса пользователя
    loadUserBalance: async function (contact) {
      if (!contact || (!contact.email && !contact.phone)) return;

      try {
        this.showLoading(true);
        // Отменяем предыдущий запрос, если он ещё активен
        if (this.state.activeFetchController) {
          try {
            this.state.activeFetchController.abort();
          } catch (_) {}
        }
        const controller = new AbortController();
        this.state.activeFetchController = controller;

        const params = new URLSearchParams();
        if (contact.email) params.append('email', contact.email);
        if (contact.phone) params.append('phone', contact.phone);

        const response = await fetch(
          `${this.config.apiUrl}/api/projects/${this.config.projectId}/users/balance?${params}`,
          {
            method: 'GET',
            signal: controller.signal
          }
        );

        const data = await response.json();

        if (data && data.success && data.user) {
          // Пользователь найден — монтируем виджет при необходимости и обновляем
          if (this.ensureWidgetMounted()) {
            this.state.bonusBalance = data.balance || 0;
            this.updateBalanceDisplay();
            this.log('Баланс загружен:', this.state.bonusBalance);
          }
        } else {
          // Пользователь не найден/не авторизован — виджет не показываем вовсе
          this.removeWidget();
        }
      } catch (error) {
        if (error && error.name === 'AbortError') {
          this.log('Запрос баланса отменён (новый ввод)');
        } else {
          this.log('Ошибка загрузки баланса:', error);
        }
      } finally {
        this.showLoading(false);
      }
    },

    // Обновление отображения баланса
    updateBalanceDisplay: function () {
      const balanceElement = document.querySelector('.bonus-balance');
      const balanceAmount = document.querySelector('.bonus-balance-amount');
      const amountInput = document.getElementById('bonus-amount-input');
      const applyButton = document.getElementById('apply-bonus-button');

      if (this.state.bonusBalance > 0) {
        balanceElement.style.display = 'block';
        balanceAmount.textContent = this.state.bonusBalance;
        amountInput.style.display = 'block';
        applyButton.style.display = 'block';

        // Устанавливаем максимум для input
        const cartTotal = this.getCartTotal();
        const maxBonuses = Math.min(this.state.bonusBalance, cartTotal);
        amountInput.max = maxBonuses.toFixed(2);
        amountInput.placeholder = `Макс: ${maxBonuses.toFixed(2)} бонусов`;
      } else {
        balanceElement.style.display = 'none';
        amountInput.style.display = 'none';
        applyButton.style.display = 'none';
      }
    },

    // Получение суммы корзины
    getCartTotal: function () {
      // Ищем элемент с общей суммой
      const totalElement = document.querySelector(
        '.t706__cartwin-totalamount-withoutdelivery, .t706__cartwin-totalamount'
      );
      if (totalElement) {
        const totalText = totalElement.textContent || '';
        const total = parseFloat(
          totalText.replace(/[^\d.,]/g, '').replace(',', '.')
        );
        return isNaN(total) ? 0 : Number(total.toFixed(2));
      }
      return 0;
    },

    // Применение скидки через Tilda отключено в режиме бонусов — используйте вкладку «Промокод» для стандартного поведения
    applyDiscountViaTilda: function (_amountRubles) {
      return false;
    },

    // Применение промокода из поля ввода
    applyPromocode: function () {
      try {
        var input = document.getElementById('promo-code-input');
        if (!input) return;
        var code = (input.value || '').trim();
        if (!code) {
          var ps = document.getElementById('promo-status');
          if (ps) {
            ps.style.display = 'block';
            ps.innerHTML = 'Укажите промокод';
            setTimeout(function () {
              ps.style.display = 'none';
            }, 2000);
          }
          return;
        }
        if (typeof window.t_input_promocode__addPromocode === 'function') {
          window.t_input_promocode__addPromocode({ promocode: code });
          if (typeof window.tcart__calcPromocode === 'function') {
            try {
              window.tcart__calcPromocode();
            } catch (_) {}
          }
          if (typeof window.tcart__reDraw === 'function') {
            try {
              window.tcart__reDraw();
            } catch (_) {}
          }
          this.showSuccess('Промокод применён');
        } else {
          this.showError('Промокоды не поддерживаются в этой корзине');
        }
      } catch (e) {
        this.showError('Ошибка применения промокода');
        this.log('applyPromocode error', e);
      }
    },

    // Применение бонусов
    applyBonuses: async function () {
      const amountInput = document.getElementById('bonus-amount-input');
      const amount = parseFloat(amountInput.value) || 0;

      if (amount <= 0) {
        this.showError('Укажите количество бонусов');
        return;
      }

      if (amount > this.state.bonusBalance) {
        this.showError('Недостаточно бонусов');
        return;
      }

      const cartTotal = this.getCartTotal();
      if (amount > cartTotal) {
        this.showError(`Максимум можно использовать ${cartTotal} бонусов`);
        return;
      }

      try {
        this.showLoading(true);

        // Сохраняем примененные бонусы (без автоматического оформления и без промокодов)
        this.state.appliedBonuses = amount;
        localStorage.setItem('tilda_applied_bonuses', amount);

        // Добавляем скрытое поле с бонусами для отправки в webhook
        this.addHiddenBonusField(amount);

        // Применяем служебный промокод для фиксации списания на стороне вебхука
        try {
          if (typeof window.t_input_promocode__addPromocode === 'function') {
            window.t_input_promocode__addPromocode({ promocode: 'GUPIL' });
            if (typeof window.tcart__calcPromocode === 'function') {
              try {
                window.tcart__calcPromocode();
              } catch (_) {}
            }
            if (typeof window.tcart__reDraw === 'function') {
              try {
                window.tcart__reDraw();
              } catch (_) {}
            }
          }
        } catch (_) {}

        // Обновляем отображение (без ручной корректировки суммы)
        this.showSuccess(
          `Применено ${amount.toFixed(2)} бонусов. Промокод GUPIL активирован.`
        );
      } catch (error) {
        this.showError('Ошибка применения бонусов');
        this.log('Ошибка:', error);
      } finally {
        this.showLoading(false);
      }
    },

    // Добавление скрытого поля с бонусами
    addHiddenBonusField: function (amount) {
      // Удаляем старое поле если есть
      const oldField = document.getElementById('applied_bonuses_field');
      if (oldField) oldField.remove();

      // Создаем новое скрытое поле
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.id = 'applied_bonuses_field';
      hiddenField.name = 'appliedBonuses';
      hiddenField.value = amount;

      // Добавляем в форму
      const form = document.querySelector('.t-form, form');
      if (form) {
        form.appendChild(hiddenField);
      }
    },

    // Обновление визуального отображения суммы
    updateCartVisualTotal: function (newTotal) {
      const totalElement = document.querySelector(
        '.t706__cartwin-totalamount-withoutdelivery, .t706__cartwin-totalamount'
      );
      if (totalElement) {
        // Сохраняем оригинальную сумму
        if (!totalElement.dataset.originalAmount) {
          totalElement.dataset.originalAmount = totalElement.textContent;
        }

        // Обновляем отображение
        totalElement.innerHTML = `
          <s style="color: #999; font-size: 0.9em;">${totalElement.dataset.originalAmount}</s>
          <br>
          ${newTotal} ₽
        `;
      }
    },

    // Отображение загрузки
    showLoading: function (show) {
      const button = document.getElementById('apply-bonus-button');
      if (button) {
        button.disabled = show;
        button.innerHTML = show
          ? 'Применение...<span class="bonus-loading"></span>'
          : 'Применить бонусы';
      }
    },

    // Отображение успеха
    showSuccess: function (message) {
      const status = document.getElementById('bonus-status');
      status.innerHTML = `<div class="bonus-applied">✓ ${message}</div>`;
    },

    // Отображение ошибки
    showError: function (message) {
      const status = document.getElementById('bonus-status');
      status.innerHTML = `<div class="bonus-error">✗ ${message}</div>`;

      // Убираем через 3 секунды
      setTimeout(() => {
        status.innerHTML = '';
      }, 3000);
    },

    // Сброс примененных бонусов
    resetAppliedBonuses: function () {
      this.state.appliedBonuses = 0;
      localStorage.removeItem('tilda_applied_bonuses');

      const totalElement = document.querySelector(
        '.t706__cartwin-totalamount-withoutdelivery, .t706__cartwin-totalamount'
      );
      if (totalElement && totalElement.dataset.originalAmount) {
        totalElement.textContent = totalElement.dataset.originalAmount;
      }

      const status = document.getElementById('bonus-status');
      if (status) status.innerHTML = '';
    }
  };

  // Автоматическая инициализация при загрузке
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      // Виджет будет инициализирован вручную через TildaBonusWidget.init()
    });
  }
})();
