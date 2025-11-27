const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();
const genAI = new GoogleGenerativeAI("AIzaSyA3TaA_kE3MbUr6mQ9sQZrFDPlY1kpUVI4"); 

router.post("/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    console.log("🟦 Chat request received:", prompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🟩 Gemini Chat Response:", text);

    res.json({ text });

  } catch (err) {
    console.error("🔥 Gemini Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
