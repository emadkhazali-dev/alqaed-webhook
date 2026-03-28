const express = require("express");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "test123";
const PORT = process.env.PORT || 3000;

// الصفحة الرئيسية للتأكد أن السيرفر شغال
app.get("/", (req, res) => {
  res.status(200).send("AL_QAED SERVER WORKING");
});

// تحقق واتساب من الـ webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.log("❌ WhatsApp webhook verification failed");
  return res.status(403).send("Verification failed");
});

// استقبال رسائل واتساب
app.post("/webhook", (req, res) => {
  try {
    console.log("📩 NEW WHATSAPP WEBHOOK EVENT:");
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const from = message.from || "unknown";
      const type = message.type || "unknown";

      let text = "";

      if (type === "text") {
        text = message.text?.body || "";
      } else if (type === "button") {
        text = message.button?.text || "";
      } else if (type === "interactive") {
        text =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          "";
      }

      console.log("==================================");
      console.log("📱 From:", from);
      console.log("🧩 Type:", type);
      console.log("💬 Message:", text);
      console.log("==================================");
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});