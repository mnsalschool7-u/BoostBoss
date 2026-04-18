const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const nodemailer = require("nodemailer");

dotenv.config();

const requiredEnvVars = [];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
const adminPassword = process.env.ADMIN_PASSWORD || "";
const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || "";
const pokeWebhookUrl = process.env.POKE_WEBHOOK_URL || "";
const pokeApiToken = process.env.POKE_API_TOKEN || "";

const app = express();
const publicDir = __dirname;
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "data");
const ordersFile = path.join(dataDir, "orders.json");
const feedbackFile = path.join(dataDir, "feedback.json");
const statusFile = path.join(dataDir, "status.json");
const uploadsDir = path.join(dataDir, "uploads");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadsDir),
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      callback(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
      return;
    }

    callback(new Error("Only image uploads are supported."));
  },
});

const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && notificationEmail);
const mailTransport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: `${process.env.SMTP_SECURE || "true"}` !== "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

function readOrders() {
  try {
    const raw = fs.readFileSync(ordersFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function readFeedback() {
  try {
    const raw = fs.readFileSync(feedbackFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function writeFeedback(items) {
  fs.writeFileSync(feedbackFile, JSON.stringify(items, null, 2));
}

function readAvailabilityStatus() {
  try {
    const raw = fs.readFileSync(statusFile, "utf8");
    const parsed = JSON.parse(raw);
    return {
      isOpen: Boolean(parsed.isOpen),
      updatedAt: parsed.updatedAt || null,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { isOpen: false, updatedAt: null };
    }

    throw error;
  }
}

function writeAvailabilityStatus(status) {
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

function upsertOrder(nextOrder) {
  const orders = readOrders();
  const existingIndex = orders.findIndex((order) => order.sessionId === nextOrder.sessionId);

  if (existingIndex >= 0) {
    orders[existingIndex] = { ...orders[existingIndex], ...nextOrder };
  } else {
    orders.unshift(nextOrder);
  }

  writeOrders(orders);
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";

  return cookieHeader.split(";").reduce((cookies, part) => {
    const trimmed = part.trim();

    if (!trimmed) {
      return cookies;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed;
    const value = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : "";
    cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function isAdminAuthenticated(req) {
  if (!adminPassword) {
    return false;
  }

  const cookies = parseCookies(req);
  return cookies["boostboss_admin"] === adminPassword;
}

function requireAdmin(req, res, next) {
  if (isAdminAuthenticated(req)) {
    return next();
  }

  return res.status(401).json({ error: "Admin login required." });
}

function summarizeLocation(order) {
  if (order.locationType === "Dorm") {
    const dormBuilding = order.woodlandHillBuilding || order.dormBuilding;
    const community = order.vanWinkleCommunity ? `, ${order.vanWinkleCommunity}` : "";
    return `${dormBuilding} Room ${order.roomNumber}${community}`;
  }

  return `${order.building} - ${order.classroomDetails}`;
}

async function sendOrderNotification(order) {
  if (!mailTransport || !notificationEmail) {
    return false;
  }

  const deliveryLine = order.deliveryDetails
    ? `${order.deliveryType} - ${order.deliveryDetails}`
    : order.deliveryType;

  await mailTransport.sendMail({
    from: process.env.SMTP_USER,
    to: notificationEmail,
    subject: `New Boost Boss order from ${order.customerName}`,
    text: [
      `New Boost Boss order received.`,
      ``,
      `Name: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Pickup location: ${order.orderedFrom}`,
      `Delivery location: ${order.locationSummary}`,
      `Delivery type: ${deliveryLine}`,
      `Payment method: ${order.paymentMethod}`,
      `Screenshot: ${order.screenshotPath ? `${process.env.PUBLIC_BASE_URL || ""}${order.screenshotPath}` : "Uploaded on server"}`,
      `Order ID: ${order.sessionId}`,
    ].join("\n"),
  });

  return true;
}

async function sendFeedbackNotification(feedback) {
  if (!mailTransport || !notificationEmail) {
    return false;
  }

  await mailTransport.sendMail({
    from: process.env.SMTP_USER,
    to: notificationEmail,
    subject: `New Boost Boss suggestion`,
    text: [
      `New Boost Boss suggestion received.`,
      ``,
      `Name: ${feedback.name}`,
      `Message: ${feedback.message}`,
      `Feedback ID: ${feedback.id}`,
    ].join("\n"),
  });

  return true;
}

async function sendPokeNotification(order) {
  if (!pokeWebhookUrl || !pokeApiToken) {
    return false;
  }

  const response = await fetch(pokeWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pokeApiToken}`,
    },
    body: JSON.stringify({
      name: order.customerName,
      phone: order.phone,
      pickup: order.orderedFrom,
      delivery: order.locationSummary,
      type: order.deliveryType,
      payment: order.paymentMethod,
      orderId: order.sessionId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Poke notification failed with status ${response.status}`);
  }

  return true;
}

app.use(express.json());
app.use(express.static(publicDir));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/status", (_req, res) => {
  try {
    return res.json(readAvailabilityStatus());
  } catch (error) {
    return res.status(500).json({ error: "Unable to read live availability." });
  }
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: isAdminAuthenticated(req) });
});

app.post("/api/admin/status", requireAdmin, (req, res) => {
  const nextStatus = {
    isOpen: Boolean(req.body.isOpen),
    updatedAt: new Date().toISOString(),
  };

  try {
    writeAvailabilityStatus(nextStatus);
    return res.json(nextStatus);
  } catch (error) {
    return res.status(500).json({ error: "Unable to update live availability." });
  }
});

app.post("/api/admin/login", (req, res) => {
  if (!adminPassword) {
    return res.status(503).json({ error: "Admin password is not configured on the server." });
  }

  if (req.body.password !== adminPassword) {
    return res.status(401).json({ error: "Incorrect admin password." });
  }

  res.setHeader(
    "Set-Cookie",
    `boostboss_admin=${encodeURIComponent(adminPassword)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`
  );
  return res.json({ authenticated: true });
});

app.post("/api/admin/logout", (_req, res) => {
  res.setHeader(
    "Set-Cookie",
    "boostboss_admin=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
  );
  return res.json({ authenticated: false });
});

app.post("/api/upload-screenshot", upload.single("orderScreenshot"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Please upload a screenshot image." });
  }

  return res.json({
    screenshotPath: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
  });
});

app.get("/api/orders", requireAdmin, (_req, res) => {
  try {
    return res.json(readOrders());
  } catch (error) {
    return res.status(500).json({ error: "Unable to read saved orders." });
  }
});

app.get("/api/orders/:sessionId", requireAdmin, (req, res) => {
  try {
    const order = readOrders().find((entry) => entry.sessionId === req.params.sessionId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: "Unable to read saved order." });
  }
});

app.get("/api/feedback", requireAdmin, (_req, res) => {
  try {
    return res.json(readFeedback());
  } catch (error) {
    return res.status(500).json({ error: "Unable to read feedback." });
  }
});

app.post("/api/feedback", async (req, res) => {
  const message = `${req.body.message || ""}`.trim();
  const name = `${req.body.name || "Anonymous"}`.trim() || "Anonymous";

  if (!message) {
    return res.status(400).json({ error: "Please include a suggestion." });
  }

  const feedback = {
    id: `feedback_${crypto.randomUUID()}`,
    name,
    message,
    createdAt: new Date().toISOString(),
  };

  const feedbackItems = readFeedback();
  feedbackItems.unshift(feedback);
  writeFeedback(feedbackItems);

  try {
    const notificationSent = await sendFeedbackNotification(feedback);
    return res.json({ ...feedback, notificationSent });
  } catch (error) {
    console.error("Feedback notification failed:", error.message);
    return res.json({ ...feedback, notificationSent: false });
  }
});

app.post("/api/manual-order", async (req, res) => {
  const order = req.body;

  if (!order.customerName || !order.phone || !order.orderedFrom || !order.paymentMethod) {
    return res.status(400).json({ error: "Missing required order details." });
  }

  const manualOrder = {
    sessionId: `manual_${crypto.randomUUID()}`,
    paymentStatus: "manual-submitted",
    amountTotal: 300,
    currency: "usd",
    customerName: order.customerName,
    phone: order.phone,
    orderedFrom: order.orderedFrom,
    paymentMethod: order.paymentMethod,
    deliveryType: order.deliveryType,
    deliveryDetails: order.deliveryDetails || "",
    locationType: order.locationType,
    locationSummary: summarizeLocation(order),
    woodlandHillBuilding: order.woodlandHillBuilding || "",
    screenshotPath: order.screenshotPath || "",
    createdAt: new Date().toISOString(),
    loggedAt: new Date().toISOString(),
  };

  upsertOrder(manualOrder);

  let emailNotificationSent = false;
  let pokeNotificationSent = false;

  try {
    emailNotificationSent = await sendOrderNotification(manualOrder);
  } catch (error) {
    console.error("Email notification failed:", error.message);
  }

  try {
    pokeNotificationSent = await sendPokeNotification(manualOrder);
  } catch (error) {
    console.error("Poke notification failed:", error.message);
  }

  return res.json({ ...manualOrder, emailNotificationSent, pokeNotificationSent });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const port = Number(process.env.PORT) || 3000;

if (missingEnvVars.length > 0) {
  console.warn(`Missing environment variables: ${missingEnvVars.join(", ")}`);
}

app.listen(port, () => {
  console.log(`Boost Boss is running at http://localhost:${port}`);
});
