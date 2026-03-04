import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const app = express();
const PORT = 3000;
const DB_PATH = resolve(process.cwd(), "data", "db.json");

app.use(cors());
app.use(express.json());

const reservations = new Map();

const seedProducts = [
  { id: "prod-001", name: "Преміум бездротові навушники", price: 249.99, category: "audio", stock: 6, description: "Насолоджуйтесь чудовою якістю звуку з нашими преміум бездротовими навушниками.", image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=800&q=80", badge: "Новинка", features: ["Активне шумозаглушення", "30 годин автономної роботи", "Bluetooth 5.0"] },
  { id: "prod-002", name: "Професійний ноутбук", price: 1299.99, category: "computers", stock: 15, description: "Потужний та легкий ноутбук для роботи.", image: "https://images.unsplash.com/photo-1770048792336-e2ca27785b12?w=800&q=80", badge: "Хіт продажів", features: ["Intel Core Ultra", "32 GB RAM", "OLED дисплей"] },
  { id: "prod-003", name: "Розумний годинник", price: 399.99, category: "wearables", stock: 8, description: "Відстежуйте активність і здоров'я щодня.", image: "https://images.unsplash.com/photo-1716234479503-c460b87bdf98?w=800&q=80", features: ["GPS", "ECG", "7 днів автономності"] },
  { id: "prod-004", name: "Бездротові навушники Pro", price: 199.99, category: "audio", stock: 3, description: "Компактні навушники з насиченим звуком.", image: "https://images.unsplash.com/photo-1755182529034-189a6051faae?w=800&q=80", badge: "Новинка", features: ["ANC", "24 години", "IPX4"] },
];

const defaultDB = () => ({
  products: seedProducts,
  users: [],
  addresses: [],
  paymentMethods: [],
  notificationSettings: [],
  securitySettings: [],
  sessions: [],
  orders: [],
});

const ensureDB = () => {
  const dir = resolve(process.cwd(), "data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, JSON.stringify(defaultDB(), null, 2));
};

const readDB = () => {
  ensureDB();
  return JSON.parse(readFileSync(DB_PATH, "utf-8"));
};

const saveDB = (db) => writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");
const generateToken = () => crypto.randomBytes(24).toString("hex");
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex")}`;

function releaseExpiredReservations() {
  const now = Date.now();
  const expired = [...reservations.entries()].filter(([, value]) => value.expiresAt < now);
  if (expired.length === 0) return;

  const db = readDB();

  expired.forEach(([reservationId, reservation]) => {
    reservation.items.forEach((item) => {
      const product = db.products.find((p) => p.id === item.id);
      if (product) product.stock += item.quantity;
    });
    reservations.delete(reservationId);
  });

  saveDB(db);
}

function getReservedByProduct() {
  const reservedByProduct = new Map();

  reservations.forEach((reservation) => {
    reservation.items.forEach((item) => {
      reservedByProduct.set(item.id, (reservedByProduct.get(item.id) || 0) + item.quantity);
    });
  });

  return reservedByProduct;
}

function withReservationInfo(product, reservedByProduct) {
  const temporarilyReserved = reservedByProduct.get(product.id) || 0;
  return { ...product, temporarilyReserved };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Потрібна авторизація" });
  const token = authHeader.replace("Bearer ", "");
  const db = readDB();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return res.status(401).json({ error: "Сесія не знайдена" });
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return res.status(401).json({ error: "Користувача не знайдено" });
  req.user = user;
  return next();
}

app.get("/api/products", (req, res) => {
  releaseExpiredReservations();
  const db = readDB();
  const category = req.query.category;
  const list = category && category !== "all" ? db.products.filter((p) => p.category === category) : db.products;
  const reservedByProduct = getReservedByProduct();
  res.json(list.map((product) => withReservationInfo(product, reservedByProduct)));
});

app.get("/api/products/:id", (req, res) => {
  releaseExpiredReservations();
  const db = readDB();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не знайдено" });
  const reservedByProduct = getReservedByProduct();
  res.json(withReservationInfo(product, reservedByProduct));
});

app.post("/api/auth/register", (req, res) => {
  const { firstName, lastName, email, phone = "", birthday = "", password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email і пароль обов'язкові" });
  const db = readDB();
  if (db.users.some((u) => u.email === email)) return res.status(409).json({ error: "Користувач вже існує" });

  const user = { id: generateId("usr"), firstName: firstName || "Користувач", lastName: lastName || "", email, phone, birthday, passwordHash: hashPassword(password) };
  db.users.push(user);
  db.notificationSettings.push({ userId: user.id, email: true, sms: true, marketing: false });
  db.securitySettings.push({ userId: user.id, twoFactorEnabled: false });

  const token = generateToken();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ token, user: { ...user, passwordHash: undefined } });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user || user.passwordHash !== hashPassword(password)) return res.status(401).json({ error: "Невірний email або пароль" });

  const token = generateToken();
  db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  saveDB(db);
  res.json({ token, user: { ...user, passwordHash: undefined } });
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  const db = readDB();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDB(db);
  res.json({ success: true });
});

app.get("/api/profile", authMiddleware, (req, res) => {
  const db = readDB();
  const user = req.user;
  const orders = db.orders.filter((o) => o.userId === user.id);
  const paymentMethods = db.paymentMethods.filter((p) => p.userId === user.id);
  const notifications = db.notificationSettings.find((n) => n.userId === user.id);
  const security = db.securitySettings.find((s) => s.userId === user.id);

  res.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, birthday: user.birthday },
    orders,
    addresses: [],
    paymentMethods,
    notifications,
    security,
  });
});

app.put("/api/profile", authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === req.user.id);
  db.users[idx] = { ...db.users[idx], ...req.body };
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/profile/payment-methods", authMiddleware, (req, res) => {
  const db = readDB();
  const method = { id: generateId("pay"), userId: req.user.id, ...req.body, isDefault: Boolean(req.body.isDefault) };
  if (method.isDefault) db.paymentMethods = db.paymentMethods.map((m) => m.userId === req.user.id ? { ...m, isDefault: false } : m);
  db.paymentMethods.push(method);
  saveDB(db);
  res.json(method);
});

app.delete("/api/profile/payment-methods/:id", authMiddleware, (req, res) => {
  const db = readDB();
  db.paymentMethods = db.paymentMethods.filter((m) => !(m.id === req.params.id && m.userId === req.user.id));
  saveDB(db);
  res.json({ success: true });
});

app.put("/api/profile/notifications", authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.notificationSettings.findIndex((n) => n.userId === req.user.id);
  if (idx === -1) db.notificationSettings.push({ userId: req.user.id, ...req.body });
  else db.notificationSettings[idx] = { ...db.notificationSettings[idx], ...req.body };
  saveDB(db);
  res.json({ success: true });
});

app.put("/api/profile/security/password", authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (req.user.passwordHash !== hashPassword(currentPassword)) return res.status(400).json({ error: "Невірний поточний пароль" });
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === req.user.id);
  db.users[idx].passwordHash = hashPassword(newPassword);
  saveDB(db);
  res.json({ success: true });
});

app.put("/api/profile/security/2fa", authMiddleware, (req, res) => {
  const db = readDB();
  const idx = db.securitySettings.findIndex((s) => s.userId === req.user.id);
  const value = Boolean(req.body.enabled);
  if (idx === -1) db.securitySettings.push({ userId: req.user.id, twoFactorEnabled: value });
  else db.securitySettings[idx].twoFactorEnabled = value;
  saveDB(db);
  res.json({ success: true });
});

app.post("/api/checkout/reserve", authMiddleware, (req, res) => {
  releaseExpiredReservations();
  const { items } = req.body;
  const db = readDB();

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.id);
    if (!product || product.stock < item.quantity) return res.status(400).json({ error: `Недостатньо товару: ${product?.name ?? item.id}` });
  }

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.id);
    product.stock -= item.quantity;
  }

  const reservationId = generateId("res");
  const expiresAt = Date.now() + 15 * 60 * 1000;
  reservations.set(reservationId, { userId: req.user.id, items, expiresAt });

  saveDB(db);
  res.json({ reservationId, expiresAt });
});

app.post("/api/orders", authMiddleware, (req, res) => {
  releaseExpiredReservations();
  const { reservationId, customerDetails = {} } = req.body;
  const db = readDB();
  const reservation = reservations.get(reservationId);

  if (!reservation || reservation.userId !== req.user.id || reservation.expiresAt < Date.now()) {
    return res.status(400).json({ error: "Резерв недійсний" });
  }

  const items = reservation.items.map((item) => {
    const product = db.products.find((p) => p.id === item.id);
    if (!product) {
      throw new Error("Товар не знайдено при формуванні замовлення");
    }

    return {
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      name: product.name,
      image: product.image,
    };
  });

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const order = {
    id: `RN-${Math.floor(Math.random() * 9000 + 1000)}`,
    userId: req.user.id,
    date: new Date().toISOString(),
    status: "Підтверджено",
    items,
    customerDetails,
    total,
  };

  db.orders.push(order);
  reservations.delete(reservationId);
  saveDB(db);

  res.json({ success: true, orderId: order.id, total });
});

app.listen(PORT, () => console.log(`✅ Backend сервер запущено на http://localhost:${PORT}`));
