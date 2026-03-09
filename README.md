
# 🚀 RetailNova: Modern E-commerce & Inventory Management

**RetailNova** — це сучасний Fullstack-застосунок для електронної комерції, розроблений для забезпечення безперебійної синхронізації інвентаризації в реальному часі та зручного користувацького досвіду. Проєкт поєднує високу продуктивність фронтенду з надійною архітектурою бази даних.

---

## 🛠 Технологічний стек

### Frontend
* **Framework:** [React 18](https://react.dev/) з [Vite 6](https://vitejs.dev/)
* **Routing:** [React Router 7](https://reactrouter.com/)
* **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
* **UI Components:** [Radix UI](https://www.radix-ui.com/) (Accessibility-first)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Animations:** [Motion](https://motion.dev/)

### Backend & Database
* **Server:** [Node.js](https://nodejs.org/) з [Express 5](https://expressjs.com/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Language:** TypeScript (Strict Mode)

---

## ✨ Ключові особливості

* **🛒 Динамічний каталог:** Фільтрація товарів за категоріями в реальному часі з підтримкою режимів перегляду "Сітка" та "Список".
* **⏱ Система резервування:** Унікальна логіка "жорсткого" резервування товарів на 15 хвилин під час оформлення замовлення для запобігання Over-selling.
* **📊 Синхронізація залишків:** Автоматичне оновлення кількості товару на складі через Prisma після успішного підтвердження замовлення.
* **👤 Особистий кабінет:** Перегляд історії замовлень, керування адресами доставки та налаштуваннями безпеки.
* **📱 Адаптивний дизайн:** Повна підтримка мобільних пристроїв та планшетів завдяки Tailwind CSS.

---

## ⚙️ Встановлення та запуск

### 1. Клонування репозиторію
```bash
git clone [https://github.com/your-username/retailnova.git](https://github.com/your-username/retailnova.git)
cd retailnova
