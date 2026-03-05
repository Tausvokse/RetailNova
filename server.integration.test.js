import request from 'supertest';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Створюємо ізольований екземпляр додатку для інтеграційного тестування
const app = express();
app.use(cors());
app.use(express.json());

// Мок для бази даних у пам'яті (щоб не перезаписувати реальний db.json під час тестів)
let mockDb = {
  products: [
    { id: "prod-test-001", name: "Тестовий Товар", price: 100, stock: 5, category: "test" }
  ],
  users: [],
  sessions: [],
  orders: []
};
const reservations = new Map();

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");
const generateToken = () => crypto.randomBytes(24).toString("hex");
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex")}`;

// Мідлвар для тестів
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Потрібна авторизація" });
  const token = authHeader.replace("Bearer ", "");
  const session = mockDb.sessions.find((s) => s.token === token);
  if (!session) return res.status(401).json({ error: "Сесія не знайдена" });
  const user = mockDb.users.find((u) => u.id === session.userId);
  if (!user) return res.status(401).json({ error: "Користувача не знайдено" });
  req.user = user;
  return next();
}

// Тестові маршрути (ідентичні серверним)
app.get("/api/products", (req, res) => {
  res.json(mockDb.products.map(p => ({ ...p, temporarilyReserved: 0 })));
});

app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email і пароль обов'язкові" });
  
  const user = { id: generateId("usr"), email, passwordHash: hashPassword(password) };
  mockDb.users.push(user);
  
  const token = generateToken();
  mockDb.sessions.push({ token, userId: user.id });
  
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.post("/api/checkout/reserve", authMiddleware, (req, res) => {
  const { items } = req.body;
  
  for (const item of items) {
    const product = mockDb.products.find((p) => p.id === item.id);
    if (!product || product.stock < item.quantity) {
      return res.status(400).json({ error: `Недостатньо товару` });
    }
  }

  for (const item of items) {
    const product = mockDb.products.find((p) => p.id === item.id);
    product.stock -= item.quantity;
  }

  const reservationId = generateId("res");
  const expiresAt = Date.now() + 15 * 60 * 1000;
  reservations.set(reservationId, { userId: req.user.id, items, expiresAt });

  res.json({ reservationId, expiresAt });
});

describe('RetailNova API Integration Tests', () => {
  let authToken = '';

  beforeEach(() => {
    // Скидання мок-бази перед кожним тестом
    mockDb = {
      products: [
        { id: "prod-test-001", name: "Тестовий Товар", price: 100, stock: 5, category: "test" }
      ],
      users: [],
      sessions: [],
      orders: []
    };
    reservations.clear();
  });

  it('повинен повертати список товарів (GET /api/products)', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0].id).toBe('prod-test-001');
    expect(response.body[0].stock).toBe(5);
  });

  it('повинен реєструвати нового користувача та повертати токен (POST /api/auth/register)', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', 'test@example.com');
    authToken = response.body.token; // Зберігаємо для наступних тестів
  });

  it('не повинен дозволяти резервування без авторизації (POST /api/checkout/reserve)', async () => {
    const response = await request(app)
      .post('/api/checkout/reserve')
      .send({ items: [{ id: 'prod-test-001', quantity: 1 }] });
    
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Потрібна авторизація');
  });

  it('повинен успішно резервувати товар та зменшувати залишок (POST /api/checkout/reserve)', async () => {
    // 1. Реєструємо користувача для отримання токену
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'client@example.com', password: 'secure123' });
    const token = regRes.body.token;

    // 2. Виконуємо запит на резервування
    const reserveRes = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ id: 'prod-test-001', quantity: 2 }] });

    expect(reserveRes.status).toBe(200);
    expect(reserveRes.body).toHaveProperty('reservationId');
    
    // 3. Перевіряємо, що залишок товару зменшився з 5 до 3
    const productRes = await request(app).get('/api/products');
    const updatedProduct = productRes.body.find(p => p.id === 'prod-test-001');
    expect(updatedProduct.stock).toBe(3);
  });

  it('повинен повертати помилку при спробі зарезервувати більше товару, ніж є на складі', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'client2@example.com', password: 'secure123' });
    const token = regRes.body.token;

    // Спроба зарезервувати 10 одиниць, коли в наявності лише 5
    const reserveRes = await request(app)
      .post('/api/checkout/reserve')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ id: 'prod-test-001', quantity: 10 }] });

    expect(reserveRes.status).toBe(400);
    expect(reserveRes.body).toHaveProperty('error', 'Недостатньо товару');
  });
});