# FoodSaver - API Endpoints

## Authentication
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/logout` - Выход

## Users
- `GET /api/users/me` - Получить текущего пользователя
- `PUT /api/users/me` - Обновить профиль

## Restaurants
- `GET /api/restaurants` - Список всех ресторанов
- `GET /api/restaurants/:id` - Информация о ресторане
- `POST /api/restaurants` - Создать ресторан (business)
- `PUT /api/restaurants/:id` - Обновить ресторан
- `GET /api/restaurants/me` - Мой ресторан (business)

## Food Offers
- `GET /api/food-offers` - Список всех предложений (с фильтрами: city, category, status)
- `GET /api/food-offers/:id` - Детали предложения
- `POST /api/food-offers` - Создать предложение (business)
- `PUT /api/food-offers/:id` - Обновить предложение (business)
- `DELETE /api/food-offers/:id` - Удалить предложение (business)
- `GET /api/food-offers/restaurant/:restaurantId` - Предложения конкретного ресторана
- `GET /api/food-offers/nearby` - Предложения рядом (по городу/региону)

## Orders
- `GET /api/orders` - Список заказов (для client - мои заказы, для business - заказы моего ресторана)
- `GET /api/orders/:id` - Детали заказа
- `POST /api/orders` - Создать заказ (client)
- `PUT /api/orders/:id/confirm` - Подтвердить заказ (business)
- `PUT /api/orders/:id/complete` - Завершить заказ (business)
- `PUT /api/orders/:id/cancel` - Отменить заказ (client или business)

## Messages
- `GET /api/messages/food-offer/:foodOfferId` - Сообщения по предложению
- `POST /api/messages` - Отправить сообщение

## Admin
- `GET /api/admin/food-offers/pending` - Предложения на модерации
- `PUT /api/admin/food-offers/:id/approve` - Одобрить предложение
- `PUT /api/admin/food-offers/:id/reject` - Отклонить предложение


