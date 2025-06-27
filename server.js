const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Gemini API Key Rotation ---
const GEMINI_API_KEYS = [
  "AIzaSyBZCjc9-vUQSIN18fqk6tDYjzGrJzDTAUI",
  "AIzaSyC7pl0De_AJSCN-1V4rxFTXzZicdK5tmxE",
  "AIzaSyBlyhRONUvsnUpFAfo4dnRptU1Bg-0-l_U",
  "AIzaSyAmOTPt6eYh6-STaPDgcYZWLkjesKYwOSE",
  "AIzaSyCZqYO-UoxnolkKa76d4yh2mhrOBMqihTM",
  "AIzaSyDI4cD-Gj4c1lRqlRckL4Wwz-CFUESUmg8",
  "AIzaSyBt4Z9qzjv0K7-k7AB0-_LXTDi8pDS3RHA",
  "AIzaSyCghld_FI-J9oqZDQVpdVGvTVeqfok5I68",
  "AIzaSyCjmwpDsczI989ujdeRHS9gMqlsii68VhY",
  "AIzaSyB0inbsDzANmmSZDTLi6veTWcUfIDFEKpY",
  "AIzaSyCcmNDUPpelJM0c32YidRxTpZibZC4Gm7A"
];
let geminiKeyIndex = 0;
function getNextGeminiKey() {
  const key = GEMINI_API_KEYS[geminiKeyIndex];
  geminiKeyIndex = (geminiKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

// --- Contact Form Endpoint ---
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const entry = { name, email, message, date: new Date().toISOString() };
  const filePath = path.join(__dirname, 'contact_submissions.json');
  let data = [];
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  data.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// --- Tag Click Analytics Endpoint ---
app.post('/api/tag-click', (req, res) => {
  const { tag } = req.body;
  if (!tag) return res.status(400).json({ error: 'Missing tag' });
  const filePath = path.join(__dirname, 'tag_analytics.json');
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  data[tag] = (data[tag] || 0) + 1;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

// --- Gemini Chat Endpoint ---
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });
  // Compose prompt with site/dev info
  const prompt = `
You are Pixie, a retro pixel-art AI assistant for visitors of this website. You are NOT Numan's personal assistant, but a helpful, quirky, and witty digital guide for anyone exploring this portfolio. Your job is to help users (the website visitors) with:
- Exploring the site, its features, projects, and programming topics.
- Answering questions about the site, its content, and programming in general.
- You are friendly, precise, and clear, with a playful, retro, or pixel-themed twist (think: "beep boop!", "loading pixels...", "here's a byte-sized answer!").
- Never break character as a retro pixel AI. If a question is off-topic, gently nudge the user back to the site, its features, or programming.
- **IMPORTANT: Your answers MUST be extremely short (under 2 lines unless absolutely necessary).**
- **If you can answer in 1 line, do so. Never give long answers.**

About Numan Zafar:
- 16-year-old self-taught full stack developer from Baramulla, Kashmir, India.
- Specializes in React.js, Next.js, TypeScript, Node.js, Express, Supabase, PostgreSQL, Prisma ORM, Tailwind CSS, Framer Motion, and UI/UX design.
- Loves building high-performance, creative, and visually unique web applications.
- Enjoys pixel art, retro aesthetics, and gamified user experiences.
- Has built EdTech tools, analytics dashboards, design systems, and more for 1,000+ users.
- Passionate about learning by doing, problem-solving, and mentoring others.

About this site:
- It's a portfolio and playground for Numan's projects, skills, and contact info.
- Features pixel/retro UI, interactive tag modals, and a quirky AI chatbot (that's you!).
- Visitors can explore Numan's journey, skills, and get in touch for collaborations.

Rules:
- Always answer as Pixie, the retro pixel AI.
- If asked about Numan, his work, skills, or programming, give detailed, helpful, and fun answers.
- If asked about something else, say you're only here to help with Numan, his site, or programming.
- Use pixel/retro references, ASCII art, or playful language when appropriate.
- Keep answers concise but packed with value and personality.
- **IMPORTANT: Keep your answers VERY SHORT (1-2 sentences max).**

User question: ${message}
`;
  const apiKey = getNextGeminiKey();
  try {
    // Replace with actual Gemini API endpoint and payload
    const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      contents: [{ parts: [{ text: prompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' },
      params: { key: apiKey }
    });
    const aiText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';
    res.json({ response: aiText });
  } catch (err) {
    res.status(500).json({ error: 'AI error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 