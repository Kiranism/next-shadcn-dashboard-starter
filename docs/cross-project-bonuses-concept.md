# Концепция межпроектных бонусов

## Текущее состояние
- Бонусы изолированы по проектам (tenant isolation)
- Каждый проект = отдельный клиент SaaS
- Пользователи привязаны к projectId

## Предлагаемая архитектура

### 1. Группы проектов (Project Groups)
```sql
-- Новая таблица
CREATE TABLE project_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_clerk_user_id VARCHAR(255) NOT NULL, -- владелец группы
  shared_bonuses BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Связь проекта с группой
ALTER TABLE projects ADD COLUMN group_id UUID REFERENCES project_groups(id);
```

### 2. Межпроектные пользователи
```sql
-- Единый пользователь для группы проектов
CREATE TABLE group_users (
  id UUID PRIMARY KEY,
  group_id UUID REFERENCES project_groups(id),
  email VARCHAR(255),
  phone VARCHAR(255),
  -- общие поля
);

-- Привязка к конкретным проектам
CREATE TABLE user_project_memberships (
  user_id UUID REFERENCES group_users(id),
  project_id UUID REFERENCES projects(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);
```

### 3. Общий баланс бонусов
```sql
-- Бонусы на уровне группы
CREATE TABLE group_bonuses (
  id UUID PRIMARY KEY,
  group_user_id UUID REFERENCES group_users(id),
  earned_project_id UUID REFERENCES projects(id), -- где заработан
  amount DECIMAL(10,2),
  type bonus_type,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Списания с указанием проекта
CREATE TABLE group_transactions (
  id UUID PRIMARY KEY,
  group_user_id UUID REFERENCES group_users(id),
  spent_project_id UUID REFERENCES projects(id), -- где потрачен
  amount DECIMAL(10,2),
  type transaction_type,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## UI изменения

### В настройках проекта:
- [ ] Checkbox "Участвовать в групповых бонусах"
- [ ] Выбор группы проектов (если есть доступ)
- [ ] Настройка межпроектного обмена (коэффициенты)

### На странице бонусов:
- [ ] Переключатель "Все проекты группы / Только текущий"
- [ ] Фильтр по проектам в истории операций
- [ ] Отображение проекта в каждой транзакции

## API изменения

### Новые endpoints:
```
GET /api/groups/:groupId/users/balance
POST /api/groups/:groupId/transactions
GET /api/groups/:groupId/analytics
```

### Widget изменения:
- Поддержка `groupId` вместо `projectId`
- Общий баланс группы
- Указание проекта при списании

## Миграция
1. Создать группы для существующих проектов (по 1 проекту = 1 группа)
2. Мигрировать пользователей в group_users
3. Перенести бонусы в group_bonuses
4. Обновить widget и API

## Безопасность
- Доступ к группе только у owner_clerk_user_id
- Валидация принадлежности проектов к группе
- Логирование межпроектных операций

## Бизнес-логика
- Настройка "долгов" между проектами
- Автоматическое списание с основного проекта группы
- Отчёты по движению бонусов между проектами
