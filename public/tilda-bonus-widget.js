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
      _cartObserver: null
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
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .bonus-widget-title {
          font-size: 18px;
          font-weight: 600;
          color: #212529;
          margin-bottom: 12px;
        }
        
        .bonus-balance {
          font-size: 16px;
          color: #495057;
          margin-bottom: 16px;
        }
        
        .bonus-balance-amount {
          font-weight: 600;
          color: #28a745;
        }
        
        .bonus-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .bonus-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .bonus-button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .bonus-button:hover {
          background: #0056b3;
        }
        
        .bonus-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
        
        .bonus-applied {
          padding: 8px 12px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          color: #155724;
          font-size: 14px;
        }
        
        .bonus-error {
          padding: 8px 12px;
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 4px;
          color: #721c24;
          font-size: 14px;
          margin-top: 8px;
        }
        
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

      // Создаем контейнер для виджета
      this.createWidget();
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
        <div class="bonus-widget-title">💰 Бонусная программа</div>
        <div class="bonus-balance" style="display: none;">
          Ваш баланс: <span class="bonus-balance-amount">0</span> бонусов
        </div>
        <div class="bonus-input-group">
          <input type="number" 
                 class="bonus-input" 
                 id="bonus-amount-input" 
                 placeholder="Количество бонусов" 
                 min="0"
                 style="display: none;">
          <button class="bonus-button" 
                  id="apply-bonus-button" 
                  onclick="TildaBonusWidget.applyBonuses()"
                  style="display: none;">
            Применить бонусы
          </button>
        </div>
        <div id="bonus-status"></div>
      `;

      // Находим место для вставки (перед кнопкой оформления заказа)
      const insertPoint = this.findInsertPoint();
      if (insertPoint) {
        insertPoint.parentNode.insertBefore(container, insertPoint);
        this.log('Виджет добавлен на страницу');
      } else {
        this.log('Не удалось найти место для виджета');
      }
    },

    // Поиск места для вставки виджета
    findInsertPoint: function () {
      // Ищем блок с итоговой суммой или кнопку оформления
      const selectors = [
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

        if (data.success) {
          this.state.bonusBalance = data.balance || 0;
          this.updateBalanceDisplay();
          this.log('Баланс загружен:', this.state.bonusBalance);
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
        amountInput.max = maxBonuses;
        amountInput.placeholder = `Макс: ${maxBonuses} бонусов`;
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
        return isNaN(total) ? 0 : total;
      }
      return 0;
    },

    // Применение скидки через внутренний механизм Тильды (промокод)
    applyDiscountViaTilda: function (amountRubles) {
      try {
        if (typeof window.t_input_promocode__addPromocode === 'function') {
          var promo = {
            promocode: 'BONUS',
            discountsum: Number(amountRubles) || 0
          };
          window.t_input_promocode__addPromocode(promo);
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
          return true;
        }
      } catch (e) {
        this.log('Ошибка применения Tilda промокода:', e);
      }
      return false;
    },

    // Применение бонусов
    applyBonuses: async function () {
      const amountInput = document.getElementById('bonus-amount-input');
      const amount = parseInt(amountInput.value) || 0;

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

        // Пытаемся применить скидку через промокод Tilda, если доступно
        var appliedViaTilda = this.applyDiscountViaTilda(amount);

        // Сохраняем примененные бонусы
        this.state.appliedBonuses = amount;
        localStorage.setItem('tilda_applied_bonuses', amount);

        // Обновляем отображение
        this.showSuccess(
          appliedViaTilda
            ? `Применено ${amount} бонусов (скидка через промокод)`
            : `Применено ${amount} бонусов (-${amount} ₽)`
        );

        // Добавляем скрытое поле с бонусами для отправки в webhook
        this.addHiddenBonusField(amount);

        // Если промокод не сработал — мягко корректируем визуальную сумму
        if (!appliedViaTilda) {
          this.updateCartVisualTotal(cartTotal - amount);
        }
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
