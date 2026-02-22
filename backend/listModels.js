require("dotenv").config();
const https = require("https");

const apiKey = process.env.GEMINI_API_KEY;

https.get(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
  (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      const parsed = JSON.parse(data);
      parsed.models.forEach((m) => {
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(m.name);
        }
      });
    });
  }
).on("error", (err) => console.error(err.message));