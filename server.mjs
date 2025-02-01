import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = "https://models.inference.ai.azure.com/chat/completions";
const GITHUB_PAT = process.env.GITHUB_PAT;

// ✅ Stronger CORS configuration
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200); // Preflight request response
    }
    next();
});

app.use(express.json());

app.post("/ask-llama", async (req, res) => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GITHUB_PAT}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: req.body.messages,
                model: "Llama-3.3-70B-Instruct"
            })
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch response from Llama AI" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
