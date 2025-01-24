const express = require("express");
const {
    generateResponse,
    clearConversationHistory,
    getConversationHistory,
} = require("../services/generativeAIService");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/generate", verifyToken, async (req, res) => {
    const { input = "Give me a reply", tone = "", imageBase64 } = req.body;

    if (!input || !tone) {
        return res.status(400).json({ error: "Input and tone are required." });
    }

    try {
        const response = await generateResponse(input, tone, imageBase64);
        res.status(200).json({ response });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/clear-history", verifyToken, (req, res) => {
    clearConversationHistory();
    res.status(200).json({ message: "Conversation history cleared." });
});

router.get("/history", verifyToken, (req, res) => {
    const history = getConversationHistory();
    res.status(200).json({ history });
});

module.exports = router;
