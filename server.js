const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(express.json());
app.use(cors());

// ✅ Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ✅ إنشاء جدول
async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      whatsapp_message_id TEXT UNIQUE,
      customer_phone TEXT,
      customer_name TEXT,
      message_text TEXT,
      status TEXT DEFAULT 'جديد',
      amount NUMERIC DEFAULT 0,
      driver_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("✅ DB Ready");
}

const VERIFY_TOKEN = "test123";

// ✅ الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("AL_QAED SERVER WORKING 🚀");
});

// ✅ webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ✅ استقبال الرسائل + تخزينها
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 NEW EVENT:");

    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const msg of messages) {
          const messageId = msg.id || null;
          const phone = msg.from || null;

          const contact = contacts.find(c => c.wa_id === phone);
          const name = contact?.profile?.name || null;

          let text = "";

          if (msg.type === "text") {
            text = msg.text?.body || "";
          } else {
            text = `[${msg.type}]`;
          }

          await pool.query(
            `
            INSERT INTO orders
            (whatsapp_message_id, customer_phone, customer_name, message_text)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (whatsapp_message_id) DO NOTHING
            `,
            [messageId, phone, name, text]
          );

          console.log("✅ Saved:", text);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.sendStatus(500);
  }
});

// ✅ API للواجهة
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const orders = result.rows.map(row => ({
      id: row.id,
      customer: row.customer_name || row.customer_phone,
      driver: row.driver_name,
      status: row.status,
      amount: row.amount,
      time: row.created_at,
    }));

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// ❗ التشغيل بعد تهيئة DB
const PORT = process.env.PORT || 8080;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});