import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import TelegramBot from "node-telegram-bot-api";

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = resolve(process.cwd(), "data", "db.json");

app.use(cors());
app.use(express.json());

// ==========================================
// ГЛОБАЛЬНЕ ПЕРЕХОПЛЕННЯ ПОМИЛОК
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('🔥 КРИТИЧНА ПОМИЛКА (uncaughtException):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 НЕОБРОБЛЕНА ПОМИЛКА PROMISE (unhandledRejection):', reason);
});

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
  try {
    const dir = resolve(process.cwd(), "data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(DB_PATH)) writeFileSync(DB_PATH, JSON.stringify(defaultDB(), null, 2));
  } catch (err) {
    console.error("❌ Помилка при створенні бази даних:", err);
  }
};

const readDB = () => {
  try {
    ensureDB();
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch (err) {
    console.error("❌ Помилка при читанні бази даних:", err);
    return defaultDB();
  }
};

const saveDB = (db) => {
  try {
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("❌ Помилка при збереженні бази даних:", err);
  }
};

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

// ==========================================
// API ROUTES
// ==========================================

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

// ==========================================
// ТЕЛЕГРАМ БОТ
// ==========================================

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8691446783:AAGdzj1UZtzwL2DbhZ8pcdXSdjPgnb13t_M"; 

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== "8691446783:AAGdzj1UZtzwL2DbhZ8pcdXSdjPgnb13t_M") {
  try {
    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    bot.on("polling_error", (error) => {
      console.error("❌ Помилка Telegram бота (polling):", error.message);
    });

    const tgUserStates = new Map();
    const tgDraftOrders = new Map();

    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      tgUserStates.delete(chatId);
      bot.sendMessage(chatId, "👋 Вітаємо в офіційному боті RetailNova!\nОберіть дію з меню нижче:", {
        reply_markup: {
          keyboard: [
            [{ text: "🛍 Каталог" }, { text: "🛒 Кошик" }],
            [{ text: "👤 Мій профіль (Замовлення)" }]
          ],
          resize_keyboard: true
        }
      });
    });

    bot.on("message", (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
    
        if (!text || text.startsWith("/")) return;
    
        const state = tgUserStates.get(chatId);
    
        if (state === "AWAITING_NAME") {
          tgDraftOrders.set(chatId, { ...tgDraftOrders.get(chatId), name: text });
          tgUserStates.set(chatId, "AWAITING_PHONE");
          return bot.sendMessage(chatId, "📞 Введіть ваш номер телефону:");
        }
    
        if (state === "AWAITING_PHONE") {
          tgDraftOrders.set(chatId, { ...tgDraftOrders.get(chatId), phone: text });
          tgUserStates.delete(chatId);
          
          const details = tgDraftOrders.get(chatId);
          const order = checkoutTgOrder(chatId, {
              recipientName: details.name,
              recipientPhone: details.phone,
              deliveryMethod: "telegram-bot"
          });
    
          if (order) {
              bot.sendMessage(chatId, `✅ Замовлення <b>${order.id}</b> успішно оформлено!\nСума до сплати: ${order.total.toFixed(2)} грн.\n\nМенеджер зв'яжеться з вами найближчим часом.`, { parse_mode: "HTML" });
          } else {
              bot.sendMessage(chatId, "❌ Помилка оформлення. Можливо, час резерву вийшов або кошик порожній.");
          }
          return;
        }
    
        if (text === "🛍 Каталог") {
          releaseExpiredReservations();
          const db = readDB();
          if (db.products.length === 0) return bot.sendMessage(chatId, "Каталог порожній.");
          
          db.products.forEach(p => {
            bot.sendPhoto(chatId, p.image, {
              caption: `<b>${p.name}</b>\n\nКатегорія: ${p.category}\nЦіна: ${p.price} грн\nВ наявності: ${p.stock > 0 ? p.stock + " шт." : "Немає в наявності"}\n\n<i>${p.description}</i>`,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  p.stock > 0 ? [{ text: "➕ Додати в кошик", callback_data: `add_${p.id}` }] : []
                ]
              }
            });
          });
        } else if (text === "🛒 Кошик") {
           releaseExpiredReservations();
           const tgUserId = `tg-${chatId}`;
           const res = Array.from(reservations.values()).find(r => r.userId === tgUserId && r.expiresAt > Date.now());
           
           if (!res || res.items.length === 0) {
               return bot.sendMessage(chatId, "🛒 Ваш кошик порожній.");
           }
           
           const db = readDB();
           let cartText = "🛒 <b>Ваш кошик:</b>\n\n";
           let total = 0;
           
           res.items.forEach(item => {
               const product = db.products.find(p => p.id === item.id);
               if (product) {
                   const sum = item.quantity * product.price;
                   total += sum;
                   cartText += `▪️ ${product.name} (x${item.quantity}) — ${sum.toFixed(2)} грн\n`;
               }
           });
           
           cartText += `\n<b>Разом:</b> ${total.toFixed(2)} грн`;
           
           bot.sendMessage(chatId, cartText, {
               parse_mode: "HTML",
               reply_markup: {
                   inline_keyboard: [
                       [{ text: "✅ Оформити замовлення", callback_data: "checkout" }],
                       [{ text: "❌ Очистити кошик", callback_data: "clear_cart" }]
                   ]
               }
           });
        } else if (text === "👤 Мій профіль (Замовлення)") {
           const db = readDB();
           const userOrders = db.orders.filter(o => o.userId === `tg-${chatId}`);
           if (userOrders.length === 0) {
               return bot.sendMessage(chatId, "У вас ще немає замовлень.");
           }
           let msgText = "📦 <b>Ваші останні замовлення:</b>\n\n";
           userOrders.slice(-5).reverse().forEach(o => {
               msgText += `Замовлення <b>${o.id}</b> від ${new Date(o.date).toLocaleDateString()}\n`;
               msgText += `Сума: ${o.total.toFixed(2)} грн | Статус: ${o.status}\n\n`;
           });
           bot.sendMessage(chatId, msgText, { parse_mode: "HTML" });
        }
      });
    
      bot.on("callback_query", (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;
    
        if (data.startsWith("add_")) {
            releaseExpiredReservations();
            const productId = data.replace("add_", "");
            const success = addTgToCart(chatId, productId);
            if (success) {
                bot.answerCallbackQuery(query.id, { text: "✅ Товар додано в кошик!", show_alert: false });
            } else {
                bot.answerCallbackQuery(query.id, { text: "❌ Недостатньо товару в наявності.", show_alert: true });
            }
        } else if (data === "checkout") {
            tgUserStates.set(chatId, "AWAITING_NAME");
            bot.sendMessage(chatId, "Для оформлення замовлення, будь ласка, введіть ваше <b>ПІБ</b>:", { parse_mode: "HTML" });
            bot.answerCallbackQuery(query.id);
        } else if (data === "clear_cart") {
            const tgUserId = `tg-${chatId}`;
            for (const [id, res] of reservations.entries()) {
                if (res.userId === tgUserId) {
                    const db = readDB();
                    res.items.forEach(item => {
                        const p = db.products.find(prod => prod.id === item.id);
                        if (p) p.stock += item.quantity;
                    });
                    saveDB(db);
                    reservations.delete(id);
                    break;
                }
            }
            bot.editMessageText("🛒 Кошик очищено.", { chat_id: chatId, message_id: query.message.message_id });
            bot.answerCallbackQuery(query.id);
        }
      });
    
      function addTgToCart(chatId, productId) {
        const db = readDB();
        const product = db.products.find(p => p.id === productId);
        if (!product || product.stock < 1) return false;
    
        product.stock -= 1;
        
        const tgUserId = `tg-${chatId}`;
        let resId, reservation;
        
        for (const [id, res] of reservations.entries()) {
            if (res.userId === tgUserId && res.expiresAt > Date.now()) {
                resId = id; reservation = res; break;
            }
        }
    
        if (!reservation) {
            resId = generateId("res");
            reservation = { userId: tgUserId, items: [], expiresAt: Date.now() + 15 * 60 * 1000 };
            reservations.set(resId, reservation);
        } else {
            reservation.expiresAt = Date.now() + 15 * 60 * 1000;
        }
    
        const existingItem = reservation.items.find(i => i.id === productId);
        if (existingItem) existingItem.quantity += 1;
        else reservation.items.push({ id: productId, quantity: 1 });
    
        saveDB(db);
        return true;
      }
    
      function checkoutTgOrder(chatId, customerDetails) {
         const tgUserId = `tg-${chatId}`;
         let resId, reservation;
         
         for (const [id, res] of reservations.entries()) {
            if (res.userId === tgUserId && res.expiresAt > Date.now()) {
                resId = id; reservation = res; break;
            }
         }
         if (!reservation) return null;
    
         const db = readDB();
         const items = reservation.items.map((item) => {
            const product = db.products.find((p) => p.id === item.id);
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
            userId: tgUserId,
            date: new Date().toISOString(),
            status: "Підтверджено (Telegram)",
            items,
            customerDetails,
            total,
         };
    
         db.orders.push(order);
         reservations.delete(resId);
         saveDB(db);
         return order;
      }

    console.log("✅ Telegram-бот ініціалізовано.");
  } catch (err) {
    console.error("❌ Не вдалося запустити Telegram бота:", err.message);
  }
} else {
  console.log("⚠️ Токен Telegram-бота не знайдено. Бот не запущено.");
}

// ==========================================
// РОЗДАЧА ФРОНТЕНДУ (САЙТУ)
// ==========================================
try {
  const distPath = resolve(process.cwd(), "dist");
  app.use(express.static(distPath));

  app.use((req, res) => {
    const indexPath = join(distPath, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Файли сайту ще не зібрані (немає папки dist).");
    }
  });
} catch (err) {
  console.error("❌ Помилка налаштування фронтенду:", err);
}

app.listen(PORT, () => console.log(`✅ Backend сервер запущено на порту ${PORT}`));