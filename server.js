const express = require("express");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = "test123";
const PORT = process.env.PORT || 3000;

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("AL_QAED SERVER WORKING");
});

// تحقق واتساب
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ VERIFIED");
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Verification failed");
});

// استقبال الرسائل
app.post("/webhook", (req, res) => {
  console.log("📩 NEW MESSAGE:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});