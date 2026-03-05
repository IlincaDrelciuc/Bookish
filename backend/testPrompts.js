require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ── TEST DATA ─────────────────────────────────────────
const testReadingHistory = [
  { title: 'Harry Potter and the Philosopher\'s Stone', genres: ['Fantasy', 'Adventure'] },
  { title: '1984', genres: ['Dystopia', 'Classic'] },
  { title: 'The Hunger Games', genres: ['Dystopia', 'Young Adult', 'Adventure'] },
  { title: 'The Name of the Wind', genres: ['Fantasy', 'Adventure'] },
];
const testFavouriteGenres = ['Fantasy', 'Dystopia', 'Adventure'];
const testAlreadyRead = testReadingHistory.map(b => b.title);


const prompt1 = `Recommend 5 books for someone who enjoyed: ${testAlreadyRead.join(', ')}. Return JSON.`;


const prompt2 = `
You are an expert literary recommendation assistant.

A reader has recently finished these books:
${testReadingHistory.map(b => `- ${b.title} (${b.genres.join(', ')})`).join('\n')}

Their favourite genres are: ${testFavouriteGenres.join(', ')}.

Recommend 5 books they have NOT already read.

Return ONLY a JSON array in exactly this format:
[{"title": "...", "author": "...", "reason": "one sentence"}]
`;


const prompt3 = `
You are a personalised literary recommendation assistant with deep knowledge of world literature.

READER PROFILE:
Recently finished books:
${testReadingHistory.map(b => `- "${b.title}" (${b.genres.join(', ')})`).join('\n')}

Favourite genres: ${testFavouriteGenres.join(', ')}

TASK:
Recommend exactly 5 books this reader has NOT already read.

REQUIREMENTS:
- Each recommendation must match at least one of the reader's favourite genres
- Include at least one book published after 2010 for recency
- Include at least one lesser-known book (not a bestseller on every list)
- Do NOT recommend: ${testAlreadyRead.join(', ')}
- The reason must explain specifically WHY this book suits THIS reader's taste

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown, no backticks, no explanation outside the JSON.
[{"title": "...", "author": "...", "reason": "personalised one-sentence explanation"}]
`;

async function testAllPrompts() {
  const prompts = [
    { name: 'Prompt 1 (Basic)', prompt: prompt1 },
    { name: 'Prompt 2 (Structured)', prompt: prompt2 },
    { name: 'Prompt 3 (Detailed)', prompt: prompt3 },
  ];

  for (const { name, prompt } of prompts) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`TESTING: ${name}`);
    console.log('═'.repeat(50));

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log('Raw output:');
      console.log(text);

      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(clean);
        console.log(`\n✅ JSON parsed successfully — ${parsed.length} recommendations`);
        parsed.forEach((r, i) => {
          console.log(`  ${i+1}. ${r.title} by ${r.author}`);
          console.log(`     → ${r.reason}`);
        });
      } catch (parseErr) {
        console.log('\n❌ JSON parsing failed — output is not valid JSON');
      }

    } catch (err) {
      console.log('Error calling Gemini:', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

testAllPrompts();