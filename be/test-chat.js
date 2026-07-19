require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const models = [
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemma-2-9b-it", // maybe gemma works?
    "gemini-1.0-pro"
  ];
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  for (const m of models) {
    try {
      console.log(`Testing ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hello");
      console.log(`${m} success!`);
    } catch (e) {
      console.error(`${m} error:`, e.message.split('\n')[0]);
    }
  }
}
test();
