# 🚀 Быстрая инструкция по деплою FoodSaver

## Вариант 1: Vercel (Рекомендуется - самый простой)

### Через CLI (если уже авторизованы):
```bash
vercel login
vercel --prod --yes
```

### Через веб-интерфейс (проще всего):

1. **Зайдите на [vercel.com](https://vercel.com)**
2. **Войдите через GitHub** (или создайте аккаунт)
3. **Нажмите "Add New Project"**
4. **Импортируйте ваш репозиторий** (если проект на GitHub) или:
   - Нажмите "Browse" и выберите папку проекта
   - Или перетащите папку `dist` (уже собранный проект)
5. **Настройки автоматически определятся:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Нажмите "Deploy"**

✅ **Готово!** Ваш проект будет доступен по адресу `https://your-project.vercel.app`

---

## Вариант 2: Netlify

### Через веб-интерфейс:

1. **Зайдите на [netlify.com](https://netlify.com)**
2. **Войдите через GitHub**
3. **Нажмите "Add new site" → "Import an existing project"**
4. **Выберите репозиторий** или перетащите папку `dist`
5. **Настройки (уже в `netlify.toml`):**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Нажмите "Deploy site"**

---

## Вариант 3: GitHub Pages

1. **Установите gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Добавьте в `package.json` в секцию `scripts`:**
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

3. **Обновите `vite.config.js`:**
```js
export default defineConfig({
  base: '/FoodSaver/', // замените на название вашего репозитория
  // ... остальное
})
```

4. **Задеплойте:**
```bash
npm run deploy
```

5. **В настройках GitHub репозитория:**
   - Settings → Pages
   - Source: `gh-pages` branch
   - Save

---

## ✅ Проверка после деплоя

После деплоя проверьте:
1. ✅ Страница открывается
2. ✅ Можно залогиниться:
   - **Admin:** `admin@test.com / admin`
   - **Business:** `cafe@test.com / 123`
   - **Client:** `client@test.com / 123`
3. ✅ Данные сохраняются в localStorage
4. ✅ Все страницы работают
5. ✅ Карта работает
6. ✅ Бронирование работает

---

## 📝 Важные замечания

- **Данные хранятся в localStorage** - каждый пользователь видит свои данные
- **Нет бэкенда** - проект полностью фронтенд
- **Для продакшена** рекомендуется добавить реальный бэкенд (см. `API_ENDPOINTS.md` и `DATABASE_SCHEMA.md`)

---

## 🎯 Рекомендация

**Используйте Vercel через веб-интерфейс** - это самый быстрый и простой способ!

1. Зайдите на vercel.com
2. Войдите через GitHub
3. Перетащите папку `dist` или подключите репозиторий
4. Нажмите Deploy
5. Готово! 🎉

