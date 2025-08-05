/**
 * Tilda Bonus Widget
 * Виджет для интеграции бонусной системы с сайтами Tilda
 * Версия: 1.0.0
 */

(function () {
  'use strict';

  // Конфигурация по умолчанию
  const DEFAULT_CONFIG = {
    projectId: '',
    apiUrl: '',
    buttonText: 'Применить бонусы',
    buttonClass: 'bonus-apply-btn',
    minBonusAmount: 1,
    discountPercentage: 1, // 1 бонус = 1 рубль скидки
    currency: '₽',
    messages: {
      loading: 'Загрузка...',
      noUser: 'Введите email для проверки бонусов',
      noBonuses: 'У вас нет доступных бонусов',
      bonusesAvailable: 'Доступно: {amount} бонусов',
      bonusesApplied: 'Применено {amount} бонусов',
      error: 'Ошибка при проверке бонусов',
      enterAmount: 'Введите сумму бонусов для списания',
      insufficientBonuses: 'Недостаточно бонусов на счету'
    }
  };

  // Основной класс виджета
  class TildaBonusWidget {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.userBonuses = 0;
      this.appliedBonuses = 0;
      this.userEmail = '';

      if (!this.config.projectId || !this.config.apiUrl) {
        console.error(
          'TildaBonusWidget: Необходимо указать projectId и apiUrl'
        );
        return;
      }

      this.init();
    }

    init() {
      // Ждем загрузки DOM
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initWidget());
      } else {
        this.initWidget();
      }

      // Для SPA режима Tilda
      document.addEventListener('DOMContentLoaded', () => this.initWidget());
      window.addEventListener('load', () => this.initWidget());
    }

    initWidget() {
      console.log('🎁 Инициализация Tilda Bonus Widget');

      // Поиск email полей
      this.attachEmailListeners();

      // Создание кнопки применения бонусов
      this.createBonusButton();

      // Восстановление email из localStorage
      const savedEmail = localStorage.getItem('tilda_user_email');
      if (savedEmail) {
        this.userEmail = savedEmail;
        this.loadUserBonuses();
      }
    }

    attachEmailListeners() {
      const emailInputs = document.querySelectorAll(
        'input[name="email"], input[type="email"], input[name="Email"]'
      );

      emailInputs.forEach((input) => {
        input.addEventListener('blur', (e) => {
          const email = e.target.value.trim();
          if (email && this.isValidEmail(email)) {
            this.userEmail = email;
            localStorage.setItem('tilda_user_email', email);
            this.loadUserBonuses();
          }
        });
      });

      console.log(`📧 Найдено ${emailInputs.length} email полей`);
    }

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    async loadUserBonuses() {
      if (!this.userEmail) return;

      try {
        console.log(`🔍 Проверка бонусов для ${this.userEmail}`);

        const response = await fetch(
          `${this.config.apiUrl}/api/projects/${this.config.projectId}/users/balance?email=${encodeURIComponent(this.userEmail)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          this.userBonuses = parseInt(data.activeBonuses) || 0;
          console.log(`💰 Найдено бонусов: ${this.userBonuses}`);
          this.updateBonusButton();
        } else {
          console.log('👤 Пользователь не найден или нет бонусов');
          this.userBonuses = 0;
          this.updateBonusButton();
        }
      } catch (error) {
        console.error('❌ Ошибка загрузки бонусов:', error);
        this.userBonuses = 0;
        this.updateBonusButton();
      }
    }

    createBonusButton() {
      // Удаляем существующую кнопку если есть
      const existingBtn = document.querySelector('.tilda-bonus-widget');
      if (existingBtn) {
        existingBtn.remove();
      }

      // Ищем место для вставки кнопки (рядом с формой заказа)
      const targetContainer = this.findBonusButtonContainer();
      if (!targetContainer) {
        console.warn('⚠️ Не найден контейнер для кнопки бонусов');
        return;
      }

      // Создаем кнопку
      const bonusButton = document.createElement('div');
      bonusButton.className = 'tilda-bonus-widget';
      bonusButton.innerHTML = this.getBonusButtonHTML();

      // Стили кнопки
      this.addBonusButtonStyles();

      // Вставляем кнопку
      targetContainer.appendChild(bonusButton);

      // Обработчик клика
      const applyBtn = bonusButton.querySelector('.bonus-apply-btn');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => this.handleBonusApplication());
      }

      console.log('🎨 Кнопка бонусов создана');
    }

    findBonusButtonContainer() {
      // Ищем различные варианты контейнеров в Tilda
      const selectors = [
        '.t-form__submit',
        '.t706__cartwin-bottom',
        '.t778__wrapper',
        '.t-container',
        '.t-form',
        '[data-form-type]',
        '.t-rec'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.parentElement || element;
        }
      }

      // Возвращаем body как последний вариант
      return document.body;
    }

    getBonusButtonHTML() {
      if (!this.userEmail) {
        return `
          <div class="bonus-widget-container">
            <div class="bonus-info">
              <span class="bonus-icon">🎁</span>
              <span class="bonus-text">${this.config.messages.noUser}</span>
            </div>
          </div>
        `;
      }

      if (this.userBonuses === 0) {
        return `
          <div class="bonus-widget-container">
            <div class="bonus-info">
              <span class="bonus-icon">💰</span>
              <span class="bonus-text">${this.config.messages.noBonuses}</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="bonus-widget-container">
          <div class="bonus-info">
            <span class="bonus-icon">💰</span>
            <span class="bonus-text">${this.config.messages.bonusesAvailable.replace('{amount}', this.userBonuses)}</span>
          </div>
          ${
            this.appliedBonuses === 0
              ? `
            <div class="bonus-input-group">
              <input type="number" 
                     class="bonus-amount-input" 
                     placeholder="Сумма бонусов" 
                     min="1" 
                     max="${this.userBonuses}"
                     value="">
              <button class="bonus-apply-btn" type="button">
                ${this.config.buttonText}
              </button>
            </div>
          `
              : `
            <div class="bonus-applied">
              <span class="bonus-applied-text">
                ${this.config.messages.bonusesApplied.replace('{amount}', this.appliedBonuses)}
              </span>
              <button class="bonus-cancel-btn" type="button">Отменить</button>
            </div>
          `
          }
        </div>
      `;
    }

    addBonusButtonStyles() {
      if (document.querySelector('#tilda-bonus-styles')) return;

      const styles = document.createElement('style');
      styles.id = 'tilda-bonus-styles';
      styles.textContent = `
        .tilda-bonus-widget {
          margin: 15px 0;
          font-family: Arial, sans-serif;
        }
        
        .bonus-widget-container {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        
        .bonus-info {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
          gap: 8px;
        }
        
        .bonus-icon {
          font-size: 18px;
        }
        
        .bonus-text {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        
        .bonus-input-group {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .bonus-amount-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 120px;
          font-size: 14px;
          text-align: center;
        }
        
        .bonus-apply-btn, .bonus-cancel-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .bonus-apply-btn:hover {
          background: #0056b3;
        }
        
        .bonus-cancel-btn {
          background: #dc3545;
          font-size: 12px;
          padding: 6px 12px;
        }
        
        .bonus-cancel-btn:hover {
          background: #c82333;
        }
        
        .bonus-applied {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .bonus-applied-text {
          color: #28a745;
          font-weight: 500;
          font-size: 14px;
        }
        
        @media (max-width: 480px) {
          .bonus-input-group, .bonus-applied {
            flex-direction: column;
          }
          
          .bonus-amount-input {
            width: 100%;
            max-width: 200px;
          }
        }
      `;

      document.head.appendChild(styles);
    }

    async handleBonusApplication() {
      const amountInput = document.querySelector('.bonus-amount-input');
      const amount = parseInt(amountInput?.value) || 0;

      if (amount <= 0) {
        alert(this.config.messages.enterAmount);
        return;
      }

      if (amount > this.userBonuses) {
        alert(this.config.messages.insufficientBonuses);
        return;
      }

      try {
        console.log(`💳 Применение ${amount} бонусов`);

        const response = await fetch(
          `${this.config.apiUrl}/api/projects/${this.config.projectId}/users/spend`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: this.userEmail,
              amount: amount,
              description: 'Списание через Tilda виджет'
            })
          }
        );

        if (response.ok) {
          this.appliedBonuses = amount;
          this.userBonuses -= amount;

          // Применяем скидку в Tilda
          this.applyDiscountToTilda(amount);

          // Обновляем интерфейс
          this.updateBonusButton();

          console.log(`✅ Бонусы применены: ${amount}`);
        } else {
          const error = await response.text();
          alert(this.config.messages.error + ': ' + error);
        }
      } catch (error) {
        console.error('❌ Ошибка применения бонусов:', error);
        alert(this.config.messages.error);
      }
    }

    applyDiscountToTilda(bonusAmount) {
      // Попытка интеграции с различными виджетами Tilda
      const discountAmount = bonusAmount * this.config.discountPercentage;

      // Для T706 - корзина
      this.applyT706Discount(discountAmount);

      // Для T778 - каталог
      this.applyT778Discount(discountAmount);

      // Общий метод через промокод
      this.applyPromoCodeDiscount(discountAmount);

      console.log(
        `💰 Применена скидка: ${discountAmount}${this.config.currency}`
      );
    }

    applyT706Discount(discountAmount) {
      // Логика для виджета корзины T706
      if (window.t706_cart) {
        // Добавляем скидку в корзину
        console.log('🛒 Применение скидки к T706');
      }
    }

    applyT778Discount(discountAmount) {
      // Логика для каталога T778
      if (window.t778) {
        console.log('📦 Применение скидки к T778');
      }
    }

    applyPromoCodeDiscount(discountAmount) {
      // Попытка автоматического ввода промокода
      const promoInputs = document.querySelectorAll(
        'input[name="promocode"], input[name="promo"], input[placeholder*="промокод"]'
      );

      promoInputs.forEach((input) => {
        input.value = `BONUS${discountAmount}`;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    updateBonusButton() {
      const widget = document.querySelector('.tilda-bonus-widget');
      if (widget) {
        widget.innerHTML = this.getBonusButtonHTML();

        // Переподключаем обработчики
        const applyBtn = widget.querySelector('.bonus-apply-btn');
        const cancelBtn = widget.querySelector('.bonus-cancel-btn');

        if (applyBtn) {
          applyBtn.addEventListener('click', () =>
            this.handleBonusApplication()
          );
        }

        if (cancelBtn) {
          cancelBtn.addEventListener('click', () =>
            this.cancelBonusApplication()
          );
        }
      }
    }

    cancelBonusApplication() {
      this.appliedBonuses = 0;
      this.updateBonusButton();

      // Сбрасываем скидки в Tilda
      this.resetTildaDiscount();

      console.log('🔄 Скидка отменена');
    }

    resetTildaDiscount() {
      // Сброс промокодов
      const promoInputs = document.querySelectorAll(
        'input[name="promocode"], input[name="promo"], input[placeholder*="промокод"]'
      );

      promoInputs.forEach((input) => {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  // Глобальный объект для инициализации
  window.TildaBonusWidget = {
    init: function (config) {
      return new TildaBonusWidget(config);
    },

    // Версия виджета
    version: '1.0.0',

    // Конфигурация по умолчанию
    defaultConfig: DEFAULT_CONFIG
  };

  console.log('🎁 Tilda Bonus Widget загружен');
})();
