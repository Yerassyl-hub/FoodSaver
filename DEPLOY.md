# 🚀 Инструкция по деплою FoodSaver

Этот проект можно задеплоить на различные платформы. Все данные хранятся в localStorage браузера, поэтому не требуется отдельный бэкенд.

## 📦 Подготовка к деплою

1. Убедитесь, что проект собирается:
```bash
npm run build
```

2. Проверьте локально продакшен-версию:
```bash
npm run preview
```

## 🌐 Варианты деплоя

### 1. Vercel (Рекомендуется - самый простой)

**Через веб-интерфейс:**
1. Зайдите на [vercel.com](https://vercel.com)
2. Войдите через GitHub/GitLab/Bitbucket
3. Нажмите "Add New Project"
4. Импортируйте ваш репозиторий
5. Настройки:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Нажмите "Deploy"

**Через CLI:**
```bash
npm i -g vercel
vercel
```

**Автоматический деплой:**
После первого деплоя, каждый push в main ветку будет автоматически деплоить проект.

---

### 2. Netlify

**Через веб-интерфейс:**
1. Зайдите на [netlify.com](https://netlify.com)
2. Войдите через GitHub/GitLab/Bitbucket
3. Нажмите "Add new site" → "Import an existing project"
4. Выберите репозиторий
5. Настройки (уже настроены в `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Нажмите "Deploy site"

**Через CLI:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

---

### 3. GitHub Pages

1. Установите пакет для деплоя:
```bash
npm install --save-dev gh-pages
```

2. Добавьте в `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Обновите `vite.config.js`:
```js
export default defineConfig({
  base: '/FoodSaver/', // замените на название вашего репозитория
  // ... остальное
})
```

4. Задеплойте:
```bash
npm run deploy
```

5. В настройках репозитория GitHub:
   - Settings → Pages
   - Source: `gh-pages` branch
   - Save

---

### 4. Cloudflare Pages

1. Зайдите на [pages.cloudflare.com](https://pages.cloudflare.com)
2. Войдите через GitHub/GitLab
3. Нажмите "Create a project"
4. Выберите репозиторий
5. Настройки:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Нажмите "Save and Deploy"

---

### 5. Render

1. Зайдите на [render.com](https://render.com)
2. Создайте новый "Static Site"
3. Подключите репозиторий
4. Настройки:
   - Build Command: `npm run build`
   - Publish Directory: `dist`
5. Нажмите "Create Static Site"

---

## 🔧 Настройка после деплоя

### Переменные окружения (если понадобятся в будущем)

Если вы добавите реальный бэкенд, настройте переменные окружения:

**Vercel:**
- Settings → Environment Variables
- Добавьте `VITE_API_URL=https://your-api.com`

**Netlify:**
- Site settings → Environment variables
- Добавьте `VITE_API_URL`

**В коде:**
```js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

---

## ✅ Проверка после деплоя

После деплоя проверьте:
1. ✅ Страница открывается
2. ✅ Можно залогиниться (тестовые аккаунты из README)
3. ✅ Данные сохраняются в localStorage
4. ✅ Все страницы работают (Dashboard, Create, Messages, Admin, Settings)

---

## 🐛 Решение проблем

### Проблема: Белая страница после деплоя

**Решение:**
- Проверьте, что в `vite.config.js` установлен `base: './'`
- Убедитесь, что все маршруты настроены на SPA (Single Page Application)

### Проблема: 404 на прямых ссылках

**Решение:**
- Убедитесь, что настроены редиректы (в `vercel.json` или `netlify.toml`)
- Все маршруты должны вести на `/index.html`

### Проблема: Изображения не загружаются

**Решение:**
- Изображения из Unsplash должны работать (они внешние)
- Если используете локальные изображения, убедитесь, что они в папке `public/`

---

## 📝 Примечания

- **localStorage**: Данные хранятся локально в браузере каждого пользователя
- **Нет бэкенда**: Проект работает полностью на фронтенде
- **Масштабирование**: Для продакшена рекомендуется добавить реальный бэкенд (см. `API_ENDPOINTS.md` и `DATABASE_SCHEMA.md`)

---

## 🎯 Рекомендация

Для быстрого старта используйте **Vercel** - это самый простой и быстрый способ задеплоить проект.

