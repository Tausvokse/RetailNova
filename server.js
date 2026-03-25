import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { resolve, join } from "node:path";
import { existsSync } from "node:fs";
import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "node:events";

// ==========================================
// 1. ІНІЦІАЛІЗАЦІЯ БАЗИ ТА ШИНИ ПОДІЙ
// ==========================================
const prisma = new PrismaClient();

// Створення локального Event Bus для імплементації моделі Publish/Subscribe
class RetailEventBus extends EventEmitter {}
const eventBus = new RetailEventBus();

// ==========================================
// ГЛОБАЛЬНЕ ПЕРЕХОПЛЕННЯ ПОМИЛОК
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('🔥 КРИТИЧНА ПОМИЛКА (uncaughtException):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('🔥 НЕОБРОБЛЕНА ПОМИЛКА PROMISE (unhandledRejection):', reason);
});

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");
const generateToken = () => crypto.randomBytes(24).toString("hex");
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString("hex")}`;

// Зберігання сесій в пам'яті (токен -> userId)
const sessions = new Map();
const bootstrapAdminEmails = new Set(
  String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const TICKET_TYPE_LABELS = {
  INCIDENT: "Incident",
  CHANGE_REQUEST: "Change Request",
  SERVICE_REQUEST: "Service Request",
};

const TICKET_PRIORITY_LABELS = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const TICKET_STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

function formatSupportTicket(ticket) {
  return {
    ...ticket,
    typeLabel: TICKET_TYPE_LABELS[ticket.type] ?? ticket.type,
    priorityLabel: TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
    statusLabel: TICKET_STATUS_LABELS[ticket.status] ?? ticket.status,
  };
}

function parseTicketType(value = "") {
  const normalized = value.trim().toLowerCase();
  if (normalized === "incident") return "INCIDENT";
  if (normalized === "change request" || normalized === "change_request") return "CHANGE_REQUEST";
  if (normalized === "service request" || normalized === "service_request") return "SERVICE_REQUEST";
  throw new Error("Невірний тип звернення. Доступно: Incident / Change Request / Service Request");
}

function parseTicketPriority(value = "") {
  const normalized = value.trim().toLowerCase();
  if (normalized === "high") return "HIGH";
  if (normalized === "medium") return "MEDIUM";
  if (normalized === "low") return "LOW";
  throw new Error("Невірний пріоритет. Доступно: High / Medium / Low");
}

async function createSupportTicket(data) {
  const createdTicket = await prisma.supportTicket.create({
    data: {
      ticketCode: "PENDING",
      userId: data.userId || null,
      userName: data.userName,
      email: data.email || null,
      channel: data.channel,
      type: data.type,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      status: "NEW",
    },
  });

  const ticketCode = `RN-SUP-${String(createdTicket.id).padStart(3, "0")}`;
  const finalizedTicket = await prisma.supportTicket.update({
    where: { id: createdTicket.id },
    data: { ticketCode },
  });

  return formatSupportTicket(finalizedTicket);
}

// ==========================================
// 2. СЕРВІС РЕЗЕРВУВАННЯ (INVENTORY RESERVATION SERVICE)
// ==========================================
class InventoryReservationService {
  constructor() {
    this.reservations = new Map();
    
    // Підписка на події для декуплінгу
    eventBus.on("ReservationExpired", async ({ reservationId }) => {
       console.log(`[Inventory Service] ⏱️ Резерв ${reservationId} скасовано через тайм-аут.`);
    });
  }

  async releaseExpiredReservations() {
    const now = Date.now();
    const expired = [...this.reservations.entries()].filter(([, value]) => value.expiresAt < now);
    if (expired.length === 0) return;

    for (const [reservationId, reservation] of expired) {
      for (const item of reservation.items) {
        // Транзакційне повернення товару на склад через Prisma
        const product = await prisma.product.update({
          where: { id: item.id },
          data: { stock: { increment: item.quantity } }
        });
        
        // Генерація події про зміну залишків (FR-06)
        eventBus.emit("StockUpdated", { 
            productId: item.id, 
            newStock: product.stock, 
            reason: "reservation_expired" 
        });
      }
      this.reservations.delete(reservationId);
      eventBus.emit("ReservationExpired", { reservationId });
    }
  }

  getReservedByProduct() {
    const reservedByProduct = new Map();
    this.reservations.forEach((reservation) => {
      reservation.items.forEach((item) => {
        reservedByProduct.set(item.id, (reservedByProduct.get(item.id) || 0) + item.quantity);
      });
    });
    return reservedByProduct;
  }

  async reserveItems(userId, items) {
    await this.releaseExpiredReservations();
    
    // Транзакційне жорстке резервування (FR-03)
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Недостатньо товару: ${product?.name ?? item.id}`);
        }
      }

      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
        
        // Генерація події про зміну залишків
        eventBus.emit("StockUpdated", { 
            productId: item.id, 
            newStock: updatedProduct.stock, 
            reason: "reserved" 
        });
      }

      const reservationId = generateId("res");
      const expiresAt = Date.now() + 15 * 60 * 1000; // TTL 15 хв (FR-04)
      this.reservations.set(reservationId, { userId, items, expiresAt });
      
      return { reservationId, expiresAt };
    });
  }

  getReservation(reservationId) {
    return this.reservations.get(reservationId);
  }

  deleteReservation(reservationId) {
    this.reservations.delete(reservationId);
  }
  
  async clearUserCart(userId) {
    for (const [id, res] of this.reservations.entries()) {
      if (res.userId === userId) {
         for (const item of res.items) {
            const product = await prisma.product.update({
              where: { id: item.id },
              data: { stock: { increment: item.quantity } }
            });
            eventBus.emit("StockUpdated", { productId: item.id, newStock: product.stock, reason: "cart_cleared" });
         }
         this.reservations.delete(id);
         eventBus.emit("ReservationExpired", { reservationId: id });
      }
    }
  }
}

const inventoryService = new InventoryReservationService();

// ==========================================
// 3. СЕРВІС ЗАМОВЛЕНЬ (ORDER SERVICE)
// ==========================================
class OrderService {
  constructor() {
    eventBus.on("OrderCompleted", (data) => {
      console.log(`[Order Service] ✅ Замовлення ${data.orderId} успішно підтверджено на суму ${data.total} грн.`);
    });
  }

  async createOrder(userId, reservationId, customerDetails, source = "Web") {
    const reservation = inventoryService.getReservation(reservationId);
    
    if (!reservation || reservation.userId !== userId || reservation.expiresAt < Date.now()) {
      throw new Error("Резерв недійсний або його час вичерпано");
    }

    const itemsData = [];
    let total = 0;

    for (const item of reservation.items) {
      const product = await prisma.product.findUnique({ where: { id: item.id } });
      if (!product) throw new Error("Товар не знайдено при формуванні замовлення");
      
      itemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
      total += item.quantity * product.price;
    }

    const orderId = `RN-${Math.floor(Math.random() * 9000 + 1000)}`;
    
    let dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser && userId.startsWith("tg-")) {
        dbUser = await prisma.user.create({
            data: {
                id: userId,
                firstName: customerDetails.recipientName || "Telegram User",
                lastName: "",
                email: `${userId}@telegram.bot`,
                passwordHash: "",
                phone: customerDetails.recipientPhone || ""
            }
        });
    }

    // Запис замовлення у базу через Prisma
    const newOrder = await prisma.order.create({
      data: {
        id: orderId,
        userId: dbUser.id,
        status: `Підтверджено (${source})`,
        total: total,
        items: {
          create: itemsData
        }
      },
      include: { items: true }
    });

    inventoryService.deleteReservation(reservationId);
    
    // Генерація події завершення замовлення
    eventBus.emit("OrderCompleted", { orderId: newOrder.id, total, source });
    
    return newOrder;
  }
}

const orderService = new OrderService();

// ==========================================
// 4. ТЕЛЕГРАМ БОТ (ІНТЕГРАЦІЯ ЧЕРЕЗ EVENT BUS)
// ==========================================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8691446783:AAGdzj1UZtzwL2DbhZ8pcdXSdjPgnb13t_M"; 

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== "8691446783:AAGdzj1UZtzwL2DbhZ8pcdXSdjPgnb13t_M") {
  try {
    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

    // Бот слухає EventBus, а не базу даних безпосередньо (Публікація/Підписка)
    eventBus.on("StockUpdated", ({ productId, newStock }) => {
        console.log(`[TelegramBot] Сповіщення системи: Зміна залишку для ${productId} -> ${newStock} шт.`);
    });

    const tgUserStates = new Map();
    const tgDraftOrders = new Map();
    const tgSupportDrafts = new Map();

    const startSupportFlow = (chatId) => {
      tgSupportDrafts.set(chatId, {});
      tgUserStates.set(chatId, "SUPPORT_TYPE");
      bot.sendMessage(chatId, "🆕 Створення звернення. Вкажіть тип: Incident / Change Request / Service Request");
    };

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


    bot.onText(/\/help/, (msg) => {
      bot.sendMessage(
        msg.chat.id,
        "Доступні команди:\n/start — запуск меню\n/help — довідка\n/ticket — створити звернення\n/status <ticket_id> — статус звернення\n/mytickets — ваші звернення",
      );
    });

    bot.onText(/\/ticket/, (msg) => {
      startSupportFlow(msg.chat.id);
    });

    bot.onText(/\/status\s+(.+)/, async (msg, match) => {
      const ticketCode = (match?.[1] || "").trim();
      if (!ticketCode) {
        return bot.sendMessage(msg.chat.id, "Вкажіть номер звернення. Наприклад: /status RN-SUP-001");
      }

      const ticket = await prisma.supportTicket.findUnique({ where: { ticketCode } });
      if (!ticket) {
        return bot.sendMessage(msg.chat.id, `Звернення ${ticketCode} не знайдено.`);
      }

      const formatted = formatSupportTicket(ticket);
      bot.sendMessage(msg.chat.id, `Номер: ${formatted.ticketCode}\nТип: ${formatted.typeLabel}\nСтатус: ${formatted.statusLabel}`);
    });

    bot.onText(/\/mytickets/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = `tg-${chatId}`;
      const tickets = await prisma.supportTicket.findMany({
        where: { userId, channel: "TELEGRAM" },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      if (!tickets.length) {
        return bot.sendMessage(chatId, "У вас ще немає звернень. Створіть через /ticket");
      }

      const lines = tickets.map((ticket) => {
        const formatted = formatSupportTicket(ticket);
        return `• ${formatted.ticketCode} | ${formatted.typeLabel} | ${formatted.statusLabel}`;
      });

      bot.sendMessage(chatId, `Ваші звернення:\n${lines.join("\n")}`);
    });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        if (!text || text.startsWith("/")) return;

        const state = tgUserStates.get(chatId);
        const tgUserId = `tg-${chatId}`;

        if (state === "SUPPORT_TYPE") {
          try {
            const type = parseTicketType(text);
            tgSupportDrafts.set(chatId, { ...tgSupportDrafts.get(chatId), type });
            tgUserStates.set(chatId, "SUPPORT_SUBJECT");
            return bot.sendMessage(chatId, "Вкажіть коротку тему звернення:");
          } catch (error) {
            return bot.sendMessage(chatId, error.message);
          }
        }

        if (state === "SUPPORT_SUBJECT") {
          tgSupportDrafts.set(chatId, { ...tgSupportDrafts.get(chatId), subject: text });
          tgUserStates.set(chatId, "SUPPORT_DESCRIPTION");
          return bot.sendMessage(chatId, "Опишіть проблему або запит:");
        }

        if (state === "SUPPORT_DESCRIPTION") {
          tgSupportDrafts.set(chatId, { ...tgSupportDrafts.get(chatId), description: text });
          tgUserStates.set(chatId, "SUPPORT_PRIORITY");
          return bot.sendMessage(chatId, "Вкажіть пріоритет: High / Medium / Low");
        }

        if (state === "SUPPORT_PRIORITY") {
          try {
            const priority = parseTicketPriority(text);
            const draft = tgSupportDrafts.get(chatId) || {};
            const ticket = await createSupportTicket({
              userId: tgUserId,
              userName: msg.from?.username || `${msg.from?.first_name || "Telegram"} ${msg.from?.last_name || "User"}`.trim(),
              channel: "TELEGRAM",
              type: draft.type,
              subject: draft.subject,
              description: draft.description,
              priority,
            });

            tgSupportDrafts.delete(chatId);
            tgUserStates.delete(chatId);

            return bot.sendMessage(
              chatId,
              `Ваше звернення прийнято.\nНомер: ${ticket.ticketCode}\nТип: ${ticket.typeLabel}\nСтатус: ${ticket.statusLabel}`,
            );
          } catch (error) {
            return bot.sendMessage(chatId, error.message);
          }
        }

        if (state === "AWAITING_NAME") {
          tgDraftOrders.set(chatId, { ...tgDraftOrders.get(chatId), recipientName: text });
          tgUserStates.set(chatId, "AWAITING_PHONE");
          return bot.sendMessage(chatId, "📞 Введіть ваш номер телефону:");
        }

        if (state === "AWAITING_PHONE") {
          tgDraftOrders.set(chatId, { ...tgDraftOrders.get(chatId), recipientPhone: text });
          tgUserStates.delete(chatId);
          
          const details = tgDraftOrders.get(chatId);
          
          let resId = null;
          for (const [id, res] of inventoryService.reservations.entries()) {
              if (res.userId === tgUserId && res.expiresAt > Date.now()) {
                  resId = id; break;
              }
          }

          if (resId) {
              try {
                  const order = await orderService.createOrder(tgUserId, resId, details, "Telegram");
                  bot.sendMessage(chatId, `✅ Замовлення <b>${order.id}</b> успішно оформлено!\nСума до сплати: ${order.total.toFixed(2)} грн.\n\nМенеджер зв'яжеться з вами найближчим часом.`, { parse_mode: "HTML" });
              } catch(err) {
                  bot.sendMessage(chatId, `❌ Помилка оформлення: ${err.message}`);
              }
          } else {
              bot.sendMessage(chatId, "❌ Помилка оформлення. Можливо, час резерву вийшов або кошик порожній.");
          }
          return;
        }

        if (text === "🛍 Каталог") {
          await inventoryService.releaseExpiredReservations();
          const products = await prisma.product.findMany();
          if (products.length === 0) return bot.sendMessage(chatId, "Каталог порожній.");
          
          products.forEach(p => {
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
           await inventoryService.releaseExpiredReservations();
           const res = Array.from(inventoryService.reservations.values()).find(r => r.userId === tgUserId && r.expiresAt > Date.now());
           
           if (!res || res.items.length === 0) {
               return bot.sendMessage(chatId, "🛒 Ваш кошик порожній.");
           }
           
           let cartText = "🛒 <b>Ваш кошик:</b>\n\n";
           let total = 0;
           
           for (const item of res.items) {
               const product = await prisma.product.findUnique({ where: { id: item.id } });
               if (product) {
                   const sum = item.quantity * product.price;
                   total += sum;
                   cartText += `▪️ ${product.name} (x${item.quantity}) — ${sum.toFixed(2)} грн\n`;
               }
           }
           
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
           const userOrders = await prisma.order.findMany({
               where: { userId: tgUserId },
               orderBy: { createdAt: 'desc' },
               take: 5
           });
           if (userOrders.length === 0) {
               return bot.sendMessage(chatId, "У вас ще немає замовлень.");
           }
           let msgText = "📦 <b>Ваші останні замовлення:</b>\n\n";
           userOrders.forEach(o => {
               msgText += `Замовлення <b>${o.id}</b> від ${new Date(o.createdAt).toLocaleDateString()}\n`;
               msgText += `Сума: ${o.total.toFixed(2)} грн | Статус: ${o.status}\n\n`;
           });
           bot.sendMessage(chatId, msgText, { parse_mode: "HTML" });
        }
    });

    bot.on("callback_query", async (query) => {
      const chatId = query.message.chat.id;
      const data = query.data;
      const tgUserId = `tg-${chatId}`;

      if (data.startsWith("add_")) {
          try {
              const productId = data.replace("add_", "");
              
              let resId = null;
              let existingRes = null;
              for (const [id, res] of inventoryService.reservations.entries()) {
                  if (res.userId === tgUserId && res.expiresAt > Date.now()) {
                      resId = id; existingRes = res; break;
                  }
              }
              
              const items = existingRes ? [...existingRes.items] : [];
              const itemIdx = items.findIndex(i => i.id === productId);
              if (itemIdx >= 0) items[itemIdx].quantity += 1;
              else items.push({ id: productId, quantity: 1 });

              if (resId) inventoryService.deleteReservation(resId);
              await inventoryService.reserveItems(tgUserId, [{ id: productId, quantity: 1 }]);
              
              bot.answerCallbackQuery(query.id, { text: "✅ Товар додано в кошик!", show_alert: false });
          } catch (err) {
              bot.answerCallbackQuery(query.id, { text: `❌ Помилка: ${err.message}`, show_alert: true });
          }
      } else if (data === "checkout") {
          tgUserStates.set(chatId, "AWAITING_NAME");
          bot.sendMessage(chatId, "Для оформлення замовлення, будь ласка, введіть ваше <b>ПІБ</b>:", { parse_mode: "HTML" });
          bot.answerCallbackQuery(query.id);
      } else if (data === "clear_cart") {
          await inventoryService.clearUserCart(tgUserId);
          bot.editMessageText("🛒 Кошик очищено.", { chat_id: chatId, message_id: query.message.message_id });
          bot.answerCallbackQuery(query.id);
      }
    });

    console.log("✅ Telegram-бот ініціалізовано.");
  } catch (err) {
    console.error("❌ Не вдалося запустити Telegram бота:", err.message);
  }
} else {
  console.log("⚠️ Токен Telegram-бота не знайдено. Бот не запущено.");
}

// ==========================================
// 5. API GATEWAY (EXPRESS ROUTES)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Потрібна авторизація" });
  
  const token = authHeader.replace("Bearer ", "");
  const userId = sessions.get(token);
  if (!userId) return res.status(401).json({ error: "Сесія не знайдена" });
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: "Користувача не знайдено" });
  
  req.user = user;
  return next();
}

function adminMiddleware(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Доступ тільки для адміністраторів" });
  }
  return next();
}

function formatMissingTableError(err, fallback = "Потрібно виконати `npx prisma db push` для актуалізації схеми БД.") {
  if (err?.code === "P2021") {
    return `${fallback} Поточна таблиця відсутня в базі даних.`;
  }
  return err?.message || "Невідома помилка сервера";
}

app.get("/api/products", async (req, res) => {
  await inventoryService.releaseExpiredReservations();
  const category = req.query.category;
  
  const whereClause = category && category !== "all" ? { category } : {};
  const products = await prisma.product.findMany({ where: whereClause });
  
  const reservedByProduct = inventoryService.getReservedByProduct();
  const enrichedProducts = products.map(p => ({
      ...p,
      temporarilyReserved: reservedByProduct.get(p.id) || 0
  }));
  
  res.json(enrichedProducts);
});

app.get("/api/products/:id", async (req, res) => {
  await inventoryService.releaseExpiredReservations();
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: "Товар не знайдено" });
  
  const reservedByProduct = inventoryService.getReservedByProduct();
  res.json({ ...product, temporarilyReserved: reservedByProduct.get(product.id) || 0 });
});

app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, phone = "", birthday = "", password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email і пароль обов'язкові" });
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(409).json({ error: "Користувач вже існує" });

  const user = await prisma.user.create({
    data: {
        id: generateId("usr"),
        firstName: firstName || "Користувач",
        lastName: lastName || "",
        email,
        isAdmin: bootstrapAdminEmails.has(String(email).toLowerCase()),
        phone,
        birthday,
        passwordHash: hashPassword(password)
    }
  });

  const token = generateToken();
  sessions.set(token, user.id);
  
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "Невірний email або пароль" });
  }

  if (!user.isAdmin && bootstrapAdminEmails.has(String(user.email).toLowerCase())) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    user.isAdmin = true;
  }

  const token = generateToken();
  sessions.set(token, user.id);
  
  const { passwordHash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post("/api/auth/logout", authMiddleware, (req, res) => {
  const token = req.headers.authorization.replace("Bearer ", "");
  sessions.delete(token);
  res.json({ success: true });
});

app.get("/api/profile", authMiddleware, async (req, res) => {
  const user = req.user;
  const orders = await prisma.order.findMany({ 
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
  });

  res.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, birthday: user.birthday, isAdmin: user.isAdmin },
    orders,
    addresses: [],
    paymentMethods: [],
    notifications: null,
    security: null,
  });
});

app.put("/api/profile", authMiddleware, async (req, res) => {
  await prisma.user.update({
      where: { id: req.user.id },
      data: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
          birthday: req.body.birthday
      }
  });
  res.json({ success: true });
});

app.post("/api/checkout/reserve", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    const result = await inventoryService.reserveItems(req.user.id, items);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const { reservationId, customerDetails = {} } = req.body;
    const newOrder = await orderService.createOrder(req.user.id, reservationId, customerDetails, "Web");
    res.json({ success: true, orderId: newOrder.id, total: newOrder.total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


app.post("/api/support/tickets", async (req, res) => {
  try {
    const { userName, email, userId, channel = "WEB", type, subject, description, priority } = req.body;
    if (!userName || !type || !subject || !description || !priority) {
      return res.status(400).json({ error: "Заповніть обов'язкові поля звернення" });
    }

    const ticket = await createSupportTicket({
      userId: userId || null,
      userName,
      email,
      channel,
      type: parseTicketType(type),
      subject,
      description,
      priority: parseTicketPriority(priority),
    });

    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(400).json({ error: formatMissingTableError(err) });
  }
});

app.get("/api/support/tickets/:ticketCode/status", async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { ticketCode: req.params.ticketCode } });
    if (!ticket) {
      return res.status(404).json({ error: "Звернення не знайдено" });
    }

    return res.json(formatSupportTicket(ticket));
  } catch (err) {
    return res.status(400).json({ error: formatMissingTableError(err) });
  }
});

app.get("/api/support/mytickets", async (req, res) => {
  const userId = String(req.query.userId || "").trim();
  if (!userId) {
    return res.status(400).json({ error: "Потрібно передати userId" });
  }

  let tickets = [];
  try {
    tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    return res.status(400).json({ error: formatMissingTableError(err) });
  }

  return res.json(tickets.map(formatSupportTicket));
});

app.get("/api/admin/tickets", authMiddleware, adminMiddleware, async (req, res) => {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
  });

  return res.json(tickets.map(formatSupportTicket));
});

app.patch("/api/admin/tickets/:ticketCode", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, assignee, comment } = req.body;
    const updates = {};

    if (status) {
      const normalized = String(status).trim().toUpperCase().replace(/\s+/g, "_");
      if (!Object.keys(TICKET_STATUS_LABELS).includes(normalized)) {
        return res.status(400).json({ error: "Невірний статус" });
      }
      updates.status = normalized;
    }

    if (typeof assignee === "string") {
      updates.assignee = assignee.trim() || null;
    }

    if (typeof comment === "string") {
      updates.comment = comment.trim() || null;
    }

    const updated = await prisma.supportTicket.update({
      where: { ticketCode: req.params.ticketCode },
      data: updates,
    });

    return res.json(formatSupportTicket(updated));
  } catch (err) {
    return res.status(400).json({ error: formatMissingTableError(err) });
  }
});

app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const query = String(req.query.q || "").trim();
  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: { id: true, firstName: true, lastName: true, email: true, isAdmin: true },
    orderBy: [{ isAdmin: "desc" }, { email: "asc" }],
    take: 50,
  });
  res.json(users);
});

app.patch("/api/admin/users/:userId/access", authMiddleware, adminMiddleware, async (req, res) => {
  const { isAdmin } = req.body;
  if (typeof isAdmin !== "boolean") {
    return res.status(400).json({ error: "Поле isAdmin має бути boolean" });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.userId },
    data: { isAdmin },
    select: { id: true, firstName: true, lastName: true, email: true, isAdmin: true },
  });

  res.json(updated);
});

// ==========================================
// 6. СІДІНГ ДАНИХ ТА ЗАПУСК СЕРВЕРА
// ==========================================
const seedProducts = [
  { id: "prod-001", name: "Преміум бездротові навушники", price: 249.99, category: "audio", stock: 6, description: "Насолоджуйтесь чудовою якістю звуку з нашими преміум бездротовими навушниками.", image: "https://images.unsplash.com/photo-1738920424218-3d28b951740a?w=800&q=80", badge: "Новинка" },
  { id: "prod-002", name: "Професійний ноутбук", price: 1299.99, category: "computers", stock: 15, description: "Потужний та легкий ноутбук для роботи.", image: "https://images.unsplash.com/photo-1770048792336-e2ca27785b12?w=800&q=80", badge: "Хіт продажів" },
  { id: "prod-003", name: "Розумний годинник", price: 399.99, category: "wearables", stock: 8, description: "Відстежуйте активність і здоров'я щодня.", image: "https://images.unsplash.com/photo-1716234479503-c460b87bdf98?w=800&q=80" },
  { id: "prod-004", name: "Бездротові навушники Pro", price: 199.99, category: "audio", stock: 3, description: "Компактні навушники з насиченим звуком.", image: "https://images.unsplash.com/photo-1755182529034-189a6051faae?w=800&q=80", badge: "Новинка" },
];

async function initializeDatabase() {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
      EXCEPTION WHEN undefined_table THEN
        -- table may not exist before first prisma db push
        NULL;
      END $$;
    `);

    const count = await prisma.product.count();
    if (count === 0) {
        console.log("📦 Ініціалізація бази даних товарами...");
        for (const p of seedProducts) {
            await prisma.product.create({ data: p });
        }
    }
}

// РОЗДАЧА ФРОНТЕНДУ
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

initializeDatabase().then(() => {
    app.listen(PORT, () => console.log(`✅ Backend сервер запущено на порту ${PORT}`));
});