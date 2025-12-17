# 🔧 Инструкция по сбросу базы данных

Если пароли не работают, возможно в localStorage сохранены старые данные.

## Способ 1: Через консоль браузера

1. Откройте консоль браузера (F12)
2. Выполните команду:
```javascript
localStorage.removeItem('foodsaver_v1');
localStorage.removeItem('foodsaver_user');
location.reload();
```

## Способ 2: Через интерфейс (если есть кнопка сброса)

В настройках должна быть кнопка "Сброс БД" - она очистит все данные.

## Способ 3: Полная очистка localStorage

```javascript
localStorage.clear();
location.reload();
```

## После сброса

База данных автоматически инициализируется с правильными пользователями:
- **Admin:** `admin@test.com / admin`
- **Business:** `cafe@test.com / 123`
- **Client 1:** `client@test.com / 123`
- **Client 2:** `client2@test.com / 123`
- **Client 3:** `client3@test.com / 123`


