import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Дозволяє запити з фронтенду
app.use(express.json()); // Дозволяє читати JSON з тіла запиту

// --- 📦 БАЗА ДАНИХ (Тимчасова, в пам'яті) ---
let products = [
  {
    id: "prod-001",
    name: "Преміум бездротові навушники",
    price: 249.99,
    category: "audio",
    stock: 2, // Для тестування StockStatusBadge
    description: "Насолоджуйтесь чудовою якістю звуку з нашими преміум бездротовими навушниками.",
    image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=800&q=80",
    badge: "Новинка"
  },
  {
    id: "prod-002",
    name: "Смарт-годинник Pro Series",
    price: 399.99,
    category: "wearables",
    stock: 0, // Немає в наявності
    description: "Відстежуйте свою активність та здоров'я.",
    image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=800&q=80"
  },
  {
    id: "prod-003",
    name: "Ультрабук X-Gen",
    price: 1299.99,
    category: "computers",
    stock: 15, // Багато в наявності
    description: "Потужний та легкий ноутбук для роботи.",
    image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=800&q=80"
  }
];

let orders: any[] = [];
let reservations = new Map(); // Для зберігання 15-хвилинних резервів

// --- 🚀 API МАРШРУТИ (ENDPOINTS) ---

// 1. Отримати всі товари (з підтримкою фільтрації по категорії)
app.get('/api/products', (req: Request, res: Response) => {
  const category = req.query.category as string;
  if (category && category !== 'all') {
    res.json(products.filter(p => p.category === category));
  } else {
    res.json(products);
  }
});

// 2. Отримати один товар за ID
app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не знайдено" });
  res.json(product);
});

// 3. Зарезервувати товари перед оформленням (Checkout)
app.post('/api/checkout/reserve', (req: Request, res: Response) => {
  const { items, userId } = req.body; // items: [{ id, quantity }]
  
  // Перевіряємо наявність
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({ error: `Недостатньо товару: ${product?.name || item.id}` });
    }
  }

  // Зменшуємо сток (резервуємо)
  items.forEach((item: any) => {
    const product = products.find(p => p.id === item.id);
    if (product) product.stock -= item.quantity;
  });

  const reservationId = `res_${Date.now()}`;
  reservations.set(reservationId, { items, expiresAt: Date.now() + 15 * 60 * 1000 }); // 15 хвилин

  res.json({ success: true, reservationId, message: "Товари зарезервовано на 15 хвилин" });
});

// 4. Підтвердити замовлення
app.post('/api/orders', (req: Request, res: Response) => {
  const { reservationId, customerDetails } = req.body;
  const reservation = reservations.get(reservationId);

  if (!reservation || Date.now() > reservation.expiresAt) {
    return res.status(400).json({ error: "Час резервування вичерпано або резерв не знайдено" });
  }

  const newOrder = {
    id: `RN-${Math.floor(Math.random() * 10000)}`,
    date: new Date().toISOString(),
    status: "Підтверджено",
    items: reservation.items,
    customer: customerDetails
  };

  orders.push(newOrder);
  reservations.delete(reservationId); // Видаляємо резерв, бо він став замовленням

  res.json({ success: true, orderId: newOrder.id });
});

// 5. Дані профілю користувача
app.get('/api/profile', (req: Request, res: Response) => {
  res.json({
    user: {
      name: "Іван Петренко",
      email: "ivan.petrenko@example.com"
    },
    orders: orders // Повертаємо всі зроблені замовлення
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Backend сервер запущено на http://localhost:${PORT}`);
});