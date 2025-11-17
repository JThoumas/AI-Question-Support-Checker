// server/index.js

// 1. ENVIRONMENT/SECURITY SETUP
// This loads the secret variables from the .env file into process.env
require('dotenv').config({ path: '../.env' });
console.log("Loaded key:", process.env.OPENAI_API_KEY ? "✅ Found" : "❌ Not found");


// --- MODULE IMPORTS ---
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Import our new auth routes

const { OpenAI } = require('openai'); 

// 2. INITIALIZE CLIENT
let openai = null;
let useMockAI = false;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch (err) {
        console.error('Failed to initialize OpenAI client:', err.message);
        useMockAI = true;
    }
} else {
    console.warn('OPENAI_API_KEY not found. The server will run, but AI calls will be mocked.');
    useMockAI = true;
}

const app = express();

// 3. MIDDLEWARE (Consolidated and in logical order)
// 1. Enable CORS first for all requests
app.use(cors());

// 2. Enable built-in middleware to parse incoming request bodies
app.use(express.json()); // To parse application/json
app.use(express.urlencoded({ extended: true })); // To parse application/x-www-form-urlencoded

// 3. Custom logging middleware (Always comes after body parsers)
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log(`Incoming ${req.method} ${req.url} - content-type:`, req.headers['content-type']);
        // Show the parsed body
        console.log('Parsed body:', req.body);
    }
    next();
});

const PORT = process.env.PORT || 3001;

// --- Routes ---
// Mount our auth routes on the /api/auth path
app.use('/api/auth', authRoutes);

// Original test route
app.get('/api', (req, res) => {
    res.json({ message: "Hello from the AI Question Checker API!" });
});

// 4. THE CORE AI ROUTE
app.post('/api/generate-answer', async (req, res) => {
    
    let { question, keywords } = req.body; 

    // Validation: Ensure Question Exists
    if (!question) {
        return res.status(400).json({
            error: "Missing required field: 'question' must be provided."
        });
    }

    // Validation: Ensure Keywords is an Array (Default to empty array if missing)
    if (!Array.isArray(keywords)) {
        keywords = [];
    }
    
    // --- PROMPT ENGINEERING: Merging Extraction and Answer Generation ---
    const keywordsList = keywords.join(', ');
    
    const systemPrompt = `
        You are an expert, friendly career coach and mentor for college students.
        Your task is to provide a professional, encouraging, and insightful answer, 
        formatted as a Quick AI Summary, based on the user's question.

        **CRITICAL INSTRUCTIONS:**
        1. **If the 'Selected Keywords' list is NOT empty**, use those keywords heavily to tailor your response.
        2. **If the 'Selected Keywords' list IS empty (i.e., ' '),** you MUST first internally identify 3-5 relevant career keywords from the user's question before generating the answer.
        3. The final answer MUST be written in a conversational tone and be approximately 200 words.
        4. Focus on providing practical next steps and mentorship advice.

        **Current Selected Keywords:** ${keywordsList}
    `;
    
    const userMessage = question;

    try {
        // If we don't have an API key or the client failed to initialize, return a mocked reply
        if (useMockAI || !openai) {
            console.log('Using mocked AI response (no API key).');
            const mockAnswer = `Quick AI Summary:\n\nI can't access the real AI because the server is not configured with an OpenAI API key.\nHowever, based on your question: "${question}", here are a few practical next steps and suggestions:\n\n1. Research entry-level roles in finance that value practical skills over degrees (e.g., bookkeeping, bank operations, sales, client services).\n2. Gain basic technical skills (Excel, Google Sheets, or a bookkeeping tool) and highlight them on your resume.\n3. Network with local finance professionals and apply for internships or contract roles to build experience.\n4. Consider certifications (e.g., bookkeeping, QuickBooks) or short online courses to signal competence.\n\nThese steps will help you get initial traction while you build domain knowledge.`;
            return res.json({ answer: mockAnswer, mocked: true });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 500,
        });

        const aiAnswer = response.choices[0].message.content;
        res.json({ answer: aiAnswer });

    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        res.status(500).json({
            error: "Could not generate AI response due to a server error. Check the API key and server logs."
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});