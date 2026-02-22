require("dotenv").config();

const {GoogleGenerativeAI} = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini(){
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});
    const prompt = `You are a book recommendation assistant.
  A reader has enjoyed: Harry Potter (Fantasy), 1984 (Dystopia).
  Recommend 3 books they might enjoy.
  Return ONLY a JSON array in this format, nothing else:
  [{"title": "...", "author": "...", "reason": "one sentence"}]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  console.log('Gemini responded with:');
  console.log(text);
}

testGemini().catch(error => console.error('Error:', error.message));