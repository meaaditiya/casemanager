const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // Add this if not already in your main server file

const router = express.Router();

// Get API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("🔥 ERROR: GEMINI_API_KEY not found in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey); 

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
