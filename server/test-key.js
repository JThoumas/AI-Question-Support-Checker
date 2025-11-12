// 1. ENVIRONMENT LOADING DIAGNOSTICS
const dotenvResult = require('dotenv').config({ path: './.env' }); 
const { OpenAI } = require('openai');

async function testKeyDiagnostic() {
    console.log("--- Starting API Key Diagnostic Test ---");
    console.log(`Running from directory: ${process.cwd()}`);
    console.log(`Targeting .env path: ./.env`);
    console.log(`----------------------------------------`);
    
    // Check the result object from dotenv.config()
    if (dotenvResult.error) {
        console.error("❌ DOTENV ERROR: FAILED TO LOAD .env FILE!");
        console.error("Error Detail:", dotenvResult.error.message);
        console.error("This means the file was not found at the specified path (./.env).");
        console.error("ACTION REQUIRED: Ensure your .env file is in the root directory and try again.");
        return;
    }
    
    console.log("✅ DOTENV SUCCESS: The .env file was FOUND and loaded.");

    // Check the specific environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error("❌ VARIABLE MISSING: process.env.OPENAI_API_KEY is undefined.");
        console.error("ACTION REQUIRED: Check the variable name in your .env file. It MUST be OPENAI_API_KEY=...");
        return;
    }

    // Print a masked version of the key to prove it was loaded
    console.log(`✅ VARIABLE LOADED: Key starts with ${apiKey.substring(0, 5)}...`);
    
    // 2. INITIALIZE AND TEST OPENAI
    try {
        const openai = new OpenAI(); 
        
        console.log("Sending a test request to GPT-3.5-turbo...");
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: "Say hello and confirm API is working in one sentence." }
            ],
            max_tokens: 30
        });

        const aiResponse = response.choices[0].message.content;
        
        console.log("-----------------------------------------");
        console.log("🌟 FULL SUCCESS! Key is valid and AI responded:");
        console.log(aiResponse);
        console.log("-----------------------------------------");

    } catch (error) {
        // Catches 401 Unauthorized errors
        console.error("-----------------------------------------");
        console.error("❌ OpenAI API Call Failed (Key Invalid or Expired).");
        console.error("Error Message:", error.message);
        console.error("If the message mentions '401 Unauthorized', the key is loaded, but it is INVALID or EXPIRED.");
        console.error("-----------------------------------------");
    }
}

testKeyDiagnostic();