# 🧪 Тестирование входа в систему

## Проверка базы данных

Откройте консоль браузера (F12) и выполните:

```javascript
// Проверить текущую базу данных
const db = JSON.parse(localStorage.getItem('foodsaver_v1') || '{}');
console.log('Users in DB:', db.users);

// Проверить конкретного пользователя
const user = db.users?.find(u => u.email === 'client2@test.com');
console.log('client2@test.com:', user);
console.log('Password:', user?.pass || user?.password);
```

## Сброс базы данных

```javascript
localStorage.removeItem('foodsaver_v1');
localStorage.removeItem('foodsaver_user');
location.reload();
```

## Ожидаемые пользователи после сброса

```javascript
[
  { id: 1, email: 'client@test.com', pass: '123', role: 'client' },
  { id: 2, email: 'client2@test.com', pass: '123', role: 'client' },
  { id: 3, email: 'client3@test.com', pass: '123', role: 'client' },
  { id: 4, email: 'cafe@test.com', pass: '123', role: 'business' },
  { id: 5, email: 'admin@test.com', pass: 'admin', role: 'admin' }
]
```

## Проверка логина

После сброса попробуйте войти:
- Email: `client2@test.com`
- Password: `123`

В консоли должны появиться логи:
- `Login success:` - если вход успешен
- `Login failed:` - если есть проблема (покажет детали)


