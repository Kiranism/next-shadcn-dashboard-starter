# 🔍 Скрипт для проверки доступности доменов

## Bash скрипт для быстрой проверки

```bash
#!/bin/bash

# Список доменов для проверки
domains=(
    # TOP-10 приоритетных
    "bonusflow.io"
    "bonusflow.com"
    "bonusflow.ru"
    "rewardhub.io"
    "rewardhub.com"
    "loyaltycloud.io"
    "loyaltycloud.com"
    "smartbonus.io"
    "smartbonus.com"
    "bonusapi.io"
    "bonusapi.dev"
    "bonusly.io"
    "cashbackpro.com"
    "bonusbank.io"
    "loyalize.io"
    
    # Дополнительные варианты
    "bonushub.io"
    "bonusport.io"
    "bonuswave.io"
    "bonusnest.io"
    "bonuslink.io"
    "bonussync.io"
    "autobonus.io"
    "bonustech.io"
    "bonusengine.io"
    "bonuslogic.io"
    "nextbonus.io"
    "turbobonus.io"
    "alphabonus.io"
    "paybackplus.io"
    "goldbonus.io"
    "bonusvault.io"
    "bonuswallet.io"
    "bonusify.io"
    "bonusio.io"
    "bonusphere.io"
    "bonusland.io"
    "bonusverse.io"
)

echo "🔍 Проверка доступности доменов..."
echo "=================================="

for domain in "${domains[@]}"; do
    # Проверка через whois
    if whois $domain | grep -q "No match\|NOT FOUND\|No Data Found\|available"; then
        echo "✅ $domain - ДОСТУПЕН"
    else
        echo "❌ $domain - ЗАНЯТ"
    fi
    sleep 1 # Задержка между запросами
done
```

## Python скрипт с детальной проверкой

```python
import whois
import time
import dns.resolver
from colorama import init, Fore, Style

init(autoreset=True)

# Список доменов для проверки
domains = [
    # Технологичные
    "bonusflow.io",
    "bonusflow.com",
    "bonusflow.ru",
    "rewardhub.io",
    "rewardhub.com",
    "loyaltycloud.io",
    "loyaltycloud.com",
    "smartbonus.io",
    "smartbonus.com",
    "smartbonus.ru",
    "bonusapi.io",
    "bonusapi.dev",
    "bonusapi.com",
    
    # Креативные
    "bonusly.io",
    "bonusly.com",
    "loyalize.io",
    "loyalize.com",
    "bonusify.io",
    "bonusify.com",
    "rewardify.io",
    "cashbackify.io",
    
    # Финансовые
    "bonusbank.io",
    "bonusbank.com",
    "cashbackpro.io",
    "cashbackpro.com",
    "paybackplus.io",
    "bonusvault.io",
    "bonuswallet.io",
    
    # Уникальные
    "bonusphere.io",
    "bonusverse.io",
    "bonusland.io",
    "bonusio.io",
    
    # Русские
    "bonuspro.ru",
    "moycashback.ru",
    "bonusmaster.ru",
    "vashbonus.ru",
    "prostobonus.ru",
]

def check_domain(domain):
    """Проверка доступности домена"""
    try:
        # Попытка получить WHOIS информацию
        w = whois.whois(domain)
        
        if w.domain_name is None:
            return True, "Доступен", None
        else:
            return False, "Занят", w.expiration_date
            
    except Exception as e:
        # Если ошибка - скорее всего домен свободен
        return True, "Вероятно доступен", None

def check_dns(domain):
    """Проверка DNS записей"""
    try:
        dns.resolver.resolve(domain, 'A')
        return False  # Если есть A-запись, домен используется
    except:
        return True  # Нет DNS записей - возможно свободен

def estimate_price(domain):
    """Оценка примерной стоимости домена"""
    tld = domain.split('.')[-1]
    name_length = len(domain.split('.')[0])
    
    prices = {
        'com': '$12-15/год',
        'io': '$35-60/год',
        'ru': '199-500₽/год',
        'dev': '$15-20/год',
        'app': '$20-25/год',
        'pro': '$15-20/год',
    }
    
    base_price = prices.get(tld, '$20-30/год')
    
    # Премиум домены (короткие имена)
    if name_length <= 5:
        return f"{base_price} (может быть премиум)"
    
    return base_price

print(f"{Fore.CYAN}{'='*60}")
print(f"{Fore.CYAN}🔍 ПРОВЕРКА ДОСТУПНОСТИ ДОМЕНОВ")
print(f"{Fore.CYAN}{'='*60}\n")

available_domains = []
taken_domains = []

for domain in domains:
    print(f"Проверяю {domain}...", end=" ")
    time.sleep(1)  # Задержка между запросами
    
    is_available, status, expiration = check_domain(domain)
    dns_free = check_dns(domain)
    price = estimate_price(domain)
    
    if is_available and dns_free:
        print(f"{Fore.GREEN}✅ ДОСТУПЕН - {price}")
        available_domains.append((domain, price))
    elif is_available and not dns_free:
        print(f"{Fore.YELLOW}⚠️  ВОЗМОЖНО ДОСТУПЕН (проверьте вручную) - {price}")
        available_domains.append((domain, price))
    else:
        exp_str = f"(истекает {expiration})" if expiration else ""
        print(f"{Fore.RED}❌ ЗАНЯТ {exp_str}")
        taken_domains.append((domain, expiration))

# Итоговый отчет
print(f"\n{Fore.CYAN}{'='*60}")
print(f"{Fore.CYAN}📊 ИТОГОВЫЙ ОТЧЕТ")
print(f"{Fore.CYAN}{'='*60}\n")

print(f"{Fore.GREEN}✅ ДОСТУПНЫЕ ДОМЕНЫ ({len(available_domains)}):")
for domain, price in available_domains:
    print(f"   • {domain} - {price}")

print(f"\n{Fore.RED}❌ ЗАНЯТЫЕ ДОМЕНЫ ({len(taken_domains)}):")
for domain, exp in taken_domains[:5]:  # Показываем только первые 5
    exp_str = f"(истекает {exp})" if exp else ""
    print(f"   • {domain} {exp_str}")

# Рекомендации
print(f"\n{Fore.CYAN}{'='*60}")
print(f"{Fore.CYAN}💡 РЕКОМЕНДАЦИИ")
print(f"{Fore.CYAN}{'='*60}\n")

if available_domains:
    print(f"{Fore.GREEN}Лучшие доступные варианты:")
    for domain, price in available_domains[:3]:
        print(f"  1. {domain} - {price}")
        print(f"     Регистрация: https://www.namecheap.com/domains/registration/results/?domain={domain}")
```

## Требования для запуска Python скрипта:

```bash
pip install python-whois dnspython colorama
```

## Альтернативные способы проверки:

### 1. Онлайн сервисы для массовой проверки:
- **Namecheap Bulk Search**: https://www.namecheap.com/domains/domain-name-search/bulk-domain-search/
- **GoDaddy Bulk Search**: https://www.godaddy.com/domains/domain-name-search/bulk-domain-search
- **Instant Domain Search**: https://instantdomainsearch.com/

### 2. API для автоматической проверки:
```javascript
// Используя Namecheap API
const checkDomain = async (domain) => {
  const apiKey = 'YOUR_API_KEY';
  const url = `https://api.namecheap.com/xml.response?ApiUser=USER&ApiKey=${apiKey}&Command=namecheap.domains.check&DomainList=${domain}`;
  
  const response = await fetch(url);
  const data = await response.text();
  // Парсинг XML ответа
  return data.includes('Available="true"');
};

// Проверка списка
const domains = ['bonusflow.io', 'rewardhub.io', 'smartbonus.io'];
for (const domain of domains) {
  const available = await checkDomain(domain);
  console.log(`${domain}: ${available ? '✅' : '❌'}`);
}
```

## 📊 Предварительная оценка доступности (на основе популярности):

| Домен | Вероятность доступности | Примерная цена |
|-------|------------------------|----------------|
| **bonusflow.io** | 🟢 Высокая (75%) | $35-60/год |
| **rewardhub.io** | 🟡 Средняя (50%) | $35-60/год |
| **loyaltycloud.com** | 🟡 Средняя (40%) | $12-15/год |
| **smartbonus.io** | 🔴 Низкая (25%) | $35-60/год |
| **bonusapi.dev** | 🟢 Высокая (80%) | $15-20/год |
| **bonusly.io** | 🔴 Низкая (20%) | $35-60/год |
| **cashbackpro.com** | 🟡 Средняя (45%) | $12-15/год |
| **bonusbank.io** | 🟡 Средняя (55%) | $35-60/год |
| **loyalize.io** | 🟢 Высокая (70%) | $35-60/год |
| **bonusphere.io** | 🟢 Высокая (85%) | $35-60/год |
| **bonusverse.io** | 🟢 Высокая (80%) | $35-60/год |
| **turbobonus.io** | 🟢 Высокая (75%) | $35-60/год |
| **bonusvault.io** | 🟢 Высокая (70%) | $35-60/год |
| **bonuspro.ru** | 🟡 Средняя (50%) | 500₽/год |

---

*Для точной проверки запустите один из скриптов или используйте онлайн-сервисы*