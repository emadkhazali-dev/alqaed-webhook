const express = require("express");
const app = express();

app.use(express.json());

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

// ✅ استقبال الرسائل
app.post("/webhook", (req, res) => {
  console.log("📩 NEW EVENT:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

// ❗ أهم سطر (لازم يكون موجود)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});