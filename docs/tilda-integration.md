# 🛒 Интеграция с Tilda - Пошаговое руководство

Полное руководство по интеграции SaaS Bonus System с Tilda для автоматического начисления и списания бонусов.

## 📋 Оглавление
1. [🔗 Настройка Webhook](#1--настройка-webhook)
2. [💰 JavaScript для списания бонусов](#2--javascript-для-списания-бонусов)
3. [🧪 Тестирование интеграции](#3--тестирование-интеграции)
4. [❓ FAQ и решение проблем](#4--faq-и-решение-проблем)

---

## 1. 🔗 Настройка Webhook

### Шаг 1: Получите Webhook URL

1. Войдите в админ-панель SaaS Bonus System
2. Перейдите в настройки проекта
3. Скопируйте **Webhook Secret** (например: `abc123def456`)
4. Ваш Webhook URL будет:
```
https://your-bonus-system.com/api/webhook/abc123def456
```

### Шаг 2: Настройте Webhook в Tilda

1. В **Tilda**, перейдите в настройки вашего сайта
2. Найдите раздел **"Уведомления и интеграции"**
3. Добавьте **webhook** со следующими параметрами:
   - **URL**: `https://your-bonus-system.com/api/webhook/abc123def456`
   - **Метод**: `POST`
   - **Тип**: `Заказы` (Orders)

### Что происходит при заказе:

1. Клиент делает заказ на вашем сайте Tilda
2. Tilda автоматически отправляет webhook с данными заказа
3. Наша система автоматически:
   - Регистрирует пользователя (если нового)
   - Начисляет бонусы за покупку
   - Отправляет уведомление в Telegram бот (если настроен)

---

## 2. 💰 JavaScript для списания бонусов

### Шаг 1: Добавьте JavaScript код

Вставьте этот код в **настройки сайта → Дополнительно → Вставить код → В футер**:

```javascript
<script>
// Конфигурация бонусной системы
const BONUS_CONFIG = {
  projectId: 'YOUR_PROJECT_ID', // Замените на ID вашего проекта
  baseUrl: 'https://your-bonus-system.com', // Замените на ваш домен
  bonusToRuble: 1, // 1 бонус = 1 рубль (настройте по своим правилам)
  minOrderAmount: 100 // Минимальная сумма заказа для применения бонусов
};

// Глобальные переменные
let userBonusBalance = 0;
let appliedBonusAmount = 0;

// Функция получения email пользователя из корзины
function getUserEmail() {
  // Пытаемся найти email в различных местах
  const emailField = document.querySelector('input[name="email"], input[type="email"]');
  if (emailField && emailField.value) {
    return emailField.value;
  }
  
  // Если email уже был введен ранее
  const savedEmail = localStorage.getItem('user_email');
  if (savedEmail) {
    return savedEmail;
  }
  
  return null;
}

// Функция получения баланса пользователя
async function getUserBalance(email) {
  if (!email) return 0;
  
  try {
    const response = await fetch(`${BONUS_CONFIG.baseUrl}/api/projects/${BONUS_CONFIG.projectId}/users/balance?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.balance || 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Ошибка получения баланса:', error);
    return 0;
  }
}

// Функция списания бонусов
async function spendBonuses(email, amount) {
  try {
    const response = await fetch(`${BONUS_CONFIG.baseUrl}/api/projects/${BONUS_CONFIG.projectId}/users/spend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount,
        orderId: `tilda_${Date.now()}`,
        description: 'Списание бонусов при оплате на сайте'
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ошибка списания бонусов:', error);
    return { success: false, error: 'Ошибка сервера' };
  }
}

// Функция применения бонуса к корзине
function applyBonusToCart(bonusAmount) {
  if (!window.tcart || !window.t_input_promocode__addPromocode) {
    console.error('Tilda cart API недоступен');
    return false;
  }
  
  // Удаляем предыдущий бонусный промокод если есть
  if (appliedBonusAmount > 0) {
    // Здесь должна быть логика удаления предыдущего промокода
    window.location.reload(); // Простое решение - перезагрузка страницы
    return;
  }
  
  // Применяем новый бонусный промокод
  const promoData = {
    promocode: "BONUS", 
    discountsum: Math.min(bonusAmount, window.tcart.amount - BONUS_CONFIG.minOrderAmount)
  };
  
  appliedBonusAmount = promoData.discountsum;
  window.t_input_promocode__addPromocode(promoData);
  
  // Обновляем текст кнопки
  updateBonusButton();
  
  return true;
}

// Функция обновления кнопки бонусов
function updateBonusButton() {
  const bonusButton = document.querySelector('.t-btn__bonus');
  if (!bonusButton) return;
  
  const maxBonus = Math.min(userBonusBalance, window.tcart?.amount - BONUS_CONFIG.minOrderAmount || 0);
  
  if (appliedBonusAmount > 0) {
    bonusButton.innerHTML = `Отменить бонусы (-${appliedBonusAmount}₽)`;
    bonusButton.onclick = cancelBonus;
  } else if (maxBonus > 0) {
    bonusButton.innerHTML = `Списать бонусы (доступно ${userBonusBalance}₽)`;
    bonusButton.onclick = applyBonus;
  } else {
    bonusButton.innerHTML = `Списать бонусы (доступно 0₽)`;
    bonusButton.onclick = null;
    bonusButton.style.opacity = '0.5';
  }
}

// Основная функция применения бонусов
async function applyBonus() {
  const email = getUserEmail();
  
  if (!email) {
    alert('Пожалуйста, введите email для использования бонусов');
    return;
  }
  
  // Сохраняем email для следующих запросов
  localStorage.setItem('user_email', email);
  
  if (!window.tcart || window.tcart.amount < BONUS_CONFIG.minOrderAmount) {
    alert(`Минимальная сумма заказа для использования бонусов: ${BONUS_CONFIG.minOrderAmount}₽`);
    return;
  }
  
  // Получаем баланс пользователя
  userBonusBalance = await getUserBalance(email);
  
  if (userBonusBalance <= 0) {
    alert('У вас нет доступных бонусов');
    return;
  }
  
  // Рассчитываем максимальную сумму для списания (оставляем минимум для оплаты)
  const maxBonusToSpend = Math.min(
    userBonusBalance, 
    window.tcart.amount - BONUS_CONFIG.minOrderAmount
  );
  
  if (maxBonusToSpend <= 0) {
    alert('Недостаточная сумма заказа для применения бонусов');
    return;
  }
  
  // Применяем бонусы к корзине
  const success = applyBonusToCart(maxBonusToSpend);
  
  if (success) {
    // Показываем уведомление
    if (window.t && window.t.toast) {
      window.t.toast({
        text: `Применено ${maxBonusToSpend}₽ бонусов`,
        type: 'success'
      });
    }
  }
}

// Функция отмены бонусов
function cancelBonus() {
  appliedBonusAmount = 0;
  window.location.reload(); // Простое решение - перезагрузка страницы
}

// Функция создания кнопки бонусов
function createBonusButton() {
  // Удаляем предыдущую кнопку если есть
  const existingButton = document.querySelector('.t-btn__bonus');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Создаем новую кнопку
  const bonusButton = document.createElement('div');
  bonusButton.className = 't-btn t-btn__bonus';
  bonusButton.style.cssText = `
    width: 100%; 
    margin-bottom: 10px; 
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  bonusButton.innerHTML = 'Списать бонусы (загрузка...)';
  
  // Находим кнопку оформления заказа и вставляем перед ней
  const submitButton = document.querySelector('.t706 .t-form__submit, .t-btn[type="submit"]');
  if (submitButton) {
    submitButton.parentNode.insertBefore(bonusButton, submitButton);
  }
  
  return bonusButton;
}

// Инициализация при загрузке страницы
function initBonusSystem() {
  // Проверяем, что мы на странице с корзиной
  if (!window.tcart && !document.querySelector('.t706')) {
    return; // Не на странице корзины
  }
  
  // Создаем кнопку бонусов
  createBonusButton();
  
  // Загружаем баланс если email уже известен
  const email = getUserEmail();
  if (email) {
    getUserBalance(email).then(balance => {
      userBonusBalance = balance;
      updateBonusButton();
    });
  }
  
  // Отслеживаем изменения в корзине
  if (window.tcart) {
    const originalUpdate = window.tcart.update;
    window.tcart.update = function() {
      if (originalUpdate) originalUpdate.apply(this, arguments);
      setTimeout(updateBonusButton, 100);
    };
  }
  
  // Отслеживаем ввод email
  const emailInputs = document.querySelectorAll('input[name="email"], input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', async function() {
      if (this.value) {
        localStorage.setItem('user_email', this.value);
        userBonusBalance = await getUserBalance(this.value);
        updateBonusButton();
      }
    });
  });
}

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBonusSystem);
} else {
  initBonusSystem();
}

// Также запускаем при каждом изменении страницы (для SPA режима Tilda)
document.addEventListener('DOMContentLoaded', initBonusSystem);
window.addEventListener('load', initBonusSystem);

// Для отладки
window.bonusSystem = {
  getUserBalance,
  applyBonus,
  cancelBonus,
  config: BONUS_CONFIG
};

</script>
```

### Шаг 2: Настройте конфигурацию

В коде выше замените:
- `YOUR_PROJECT_ID` на ID вашего проекта
- `https://your-bonus-system.com` на ваш домен
- Настройте правила начисления и минимальные суммы

---

## 3. 🧪 Тестирование интеграции

### Тест 1: Проверка Webhook

1. Сделайте тестовый заказ на сайте
2. Проверьте в админ-панели, что:
   - Пользователь зарегистрирован
   - Бонусы начислены
   - Webhook запрос залогирован

### Тест 2: Проверка списания бонусов

1. Убедитесь, что у тестового пользователя есть бонусы
2. Добавьте товары в корзину
3. Введите email тестового пользователя
4. Проверьте, что кнопка "Списать бонусы" показывает правильный баланс
5. Нажмите кнопку и убедитесь, что скидка применилась

---

## 4. ❓ FAQ и решение проблем

### Q: Webhook не работает
**A:** Проверьте:
- Правильность URL webhook
- Что проект активен в админ-панели
- Логи webhook в админ-панели

### Q: Кнопка бонусов не появляется
**A:** Проверьте:
- Что JavaScript код добавлен в футер сайта
- Что настроен правильный PROJECT_ID
- Открыть консоль браузера для ошибок

### Q: Баланс пользователя не загружается
**A:** Проверьте:
- Что API доступен (проверьте URL в браузере)
- Что пользователь существует в системе
- Правильность email в форме

### Q: Бонусы не списываются
**A:** Проверьте:
- Достаточность баланса пользователя
- Что сумма заказа больше минимальной
- Логи API в консоли браузера

---

## 🚀 Готовые примеры URL

Замените `YOUR_DOMAIN` и `PROJECT_ID`:

### Webhook URL:
```
https://YOUR_DOMAIN/api/webhook/WEBHOOK_SECRET
```

### API для получения баланса:
```
https://YOUR_DOMAIN/api/projects/PROJECT_ID/users/balance?email=user@example.com
```

### API для списания бонусов:
```
POST https://YOUR_DOMAIN/api/projects/PROJECT_ID/users/spend
```

---

**🎯 Готово!** Теперь ваш сайт на Tilda полностью интегрирован с бонусной системой. 