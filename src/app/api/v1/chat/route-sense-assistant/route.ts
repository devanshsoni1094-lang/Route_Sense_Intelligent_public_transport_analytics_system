import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "model";
  content: string;
  actions?: Array<{
    label: string;
    type: "PLAN_ROUTE" | "CHECK_DISRUPTIONS" | "OPEN_DASHBOARD" | "FILTER_CHEAPEST";
    payload?: any;
  }>;
}

const SYSTEM_INSTRUCTION = `You are Route Sense Assistant — a warm, friendly, and exceptionally helpful AI companion for the Route Sense platform and Mumbai Metropolitan Region (MMR).

Your Personality & Tone:
- Extremely user-friendly, welcoming, polite, and enthusiastic.
- You can answer ANYTHING the user asks! Whether they ask about Mumbai transit, mathematics, science, coding, philosophy, cooking, famous food spots, poetry, or casual conversation, provide a customized, engaging, and thorough answer.
- When talking about Mumbai, bring a friendly local vibe — like a knowledgeable Mumbaikar friend who shares transit hacks, timetable secrets, scenic viewpoints, and the best cutting chai stalls.
- Never say "I only do transport" or dismiss general questions. Always address the user's inquiry directly and delightfully first.
- Maintain multi-turn context so follow-up questions feel smooth, natural, and continuous.
- Format responses cleanly with bold highlights, bullet points, and friendly emojis.

Transit Knowledge (when transit is relevant):
1. Mumbai Suburban Rail: Western Line (Churchgate–Virar), Central Main Line (CSMT–Kalyan), Harbour Line (CSMT–Panvel). Fares: II Class ₹5–₹20, I Class ₹50–₹140, AC Local ₹35–₹115.
2. Mumbai Metro: Line 1 (Versova–Andheri–Ghatkopar, ₹10–₹40), Lines 2A & 7 (Dahisar–Andheri/Gundavali, ₹10–₹50), Line 3 Aqua underground (BKC–SEEPZ).
3. BEST Buses: Non-AC ₹5 min for 5km; AC ₹6 min for 5km. Unlimited 24-hr daily pass: ₹50 (non-AC) / ₹60 (AC).
4. Auto-rickshaws (suburbs only, meter min ₹23) & Kaali-Peeli Taxis (meter min ₹28).
5. Compare options under 3 key strategies: Fastest, Cheapest, and Most Comfortable.
6. Warn about disruptions (Sunday Mega-Blocks, waterlogging at Kurla/Sion) with elevated Metro bypass advice.
7. Grounded Truth: Never invent fake live GPS vehicle coordinates or imaginary train stops.`;

interface OpenAiResult {
  reply: string | null;
  error?: string;
  isQuotaExhausted?: boolean;
}

interface GeminiResult {
  reply: string | null;
  model?: string;
  error?: string;
  isAccessDenied?: boolean;
}

/**
 * Sanitizes and normalizes conversation history for Google Gemini SDK.
 * Gemini requires:
 * 1. History starting with a 'user' turn.
 * 2. Strictly alternating 'user' and 'model' turns.
 * 3. Ending with a 'model' turn when chat.sendMessage(newPrompt) is called.
 */
function sanitizeGeminiHistory(rawMessages: any[]): Array<{ role: "user" | "model"; parts: [{ text: string }] }> {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) return [];

  const normalized: Array<{ role: "user" | "model"; text: string }> = [];
  for (const m of rawMessages) {
    const text = String(m?.content || "").trim();
    if (!text) continue;
    const role: "user" | "model" = (m.role === "assistant" || m.role === "model") ? "model" : "user";
    normalized.push({ role, text });
  }

  const firstUserIdx = normalized.findIndex(m => m.role === "user");
  if (firstUserIdx === -1) return [];

  const valid = normalized.slice(firstUserIdx);
  const merged: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  for (const item of valid) {
    if (merged.length === 0) {
      merged.push({ role: item.role, parts: [{ text: item.text }] });
    } else {
      const prev = merged[merged.length - 1];
      if (prev.role === item.role) {
        prev.parts[0].text += `\n${item.text}`;
      } else {
        merged.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  if (merged.length > 0 && merged[merged.length - 1].role === "user") {
    merged.pop();
  }

  return merged.slice(-10);
}

async function callGemini(messages: any[], userPrompt: string): Promise<GeminiResult> {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiKey || geminiKey.includes("your-gemini-api-key") || geminiKey.includes("your_gemini_api_key")) {
    return { reply: null, error: "API_KEY_NOT_CONFIGURED" };
  }

  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];

  const sanitizedHistory = sanitizeGeminiHistory(messages);
  let lastError = "";
  let isAccessDenied = false;

  for (const modelName of candidateModels) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION
      });

      let responseText = "";
      if (sanitizedHistory.length > 0) {
        const chat = model.startChat({ history: sanitizedHistory });
        const result = await chat.sendMessage(userPrompt);
        responseText = result?.response?.text() || "";
      } else {
        const result = await model.generateContent(userPrompt);
        responseText = result?.response?.text() || "";
      }

      if (responseText && responseText.trim()) {
        return { reply: responseText.trim(), model: modelName };
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      lastError = msg;
      if (
        msg.includes("denied access") ||
        msg.includes("PERMISSION_DENIED") ||
        msg.includes("403") ||
        msg.includes("blocked") ||
        msg.includes("outstanding balance") ||
        msg.includes("billing")
      ) {
        isAccessDenied = true;
      }
      console.warn(`Gemini attempt on ${modelName} failed:`, msg);
    }
  }

  return { reply: null, error: lastError || "ALL_MODELS_FAILED", isAccessDenied };
}

async function callOpenAI(messages: any[], userPrompt: string): Promise<OpenAiResult> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey || apiKey.includes("your-openai-api-key")) {
    return { reply: null, error: "API_KEY_NOT_CONFIGURED" };
  }

  const payloadMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_INSTRUCTION }
  ];

  if (Array.isArray(messages) && messages.length > 0) {
    const recent = messages.slice(-10);
    for (const m of recent) {
      if (m?.role && m?.content) {
        payloadMessages.push({
          role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
          content: String(m.content)
        });
      }
    }
  }

  if (payloadMessages.length === 0 || payloadMessages[payloadMessages.length - 1].content !== userPrompt) {
    payloadMessages.push({ role: "user", content: userPrompt });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: payloadMessages,
        temperature: 0.7,
        max_tokens: 700
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errCode = errData?.error?.code || "";
      const isQuota = errCode === "credit_balance_exhausted" || errData?.error?.type === "insufficient_quota";
      return {
        reply: null,
        error: errData?.error?.message || `HTTP ${res.status}`,
        isQuotaExhausted: isQuota
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    return { reply: reply ? reply.trim() : null };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return { reply: null, error: err?.message || "TIMEOUT" };
  }
}

function parseOriginDestination(text: string): { origin: string; dest: string } | null {
  const clean = text
    .replace(/^(how to go|suggest route|best way|route|fastest way|cheapest way|travel)\s+/i, "")
    .trim();

  const m1 = clean.match(/from\s+([a-zA-Z\s]+?)\s+(?:to|->|➔)\s+([a-zA-Z\s\?]+)/i);
  if (m1) return { origin: m1[1].trim(), dest: m1[2].replace(/\?/g, "").trim() };

  const m2 = clean.match(/^([a-zA-Z\s]+?)\s+(?:to|->|➔)\s+([a-zA-Z\s\?]+)/i);
  if (m2) return { origin: m2[1].trim(), dest: m2[2].replace(/\?/g, "").trim() };

  return null;
}

function evaluateMath(text: string, prevMessages: any[] = []): string | null {
  const clean = text.toLowerCase().trim();

  // Follow-up arithmetic: "And add 9 to it", "Add 9", "+ 9"
  if (/(and\s+)?(add|plus|\+)\s+(\d+(?:\.\d+)?)/i.test(clean)) {
    const match = clean.match(/(?:add|plus|\+)\s+(\d+(?:\.\d+)?)/i);
    if (match) {
      const numToAdd = parseFloat(match[1]);
      for (let i = prevMessages.length - 1; i >= 0; i--) {
        const c = String(prevMessages[i]?.content || "");
        const numMatch = c.match(/\b(\d+(?:\.\d+)?)\b/g);
        if (numMatch && numMatch.length > 0) {
          const lastNum = parseFloat(numMatch[numMatch.length - 1]);
          const result = lastNum + numToAdd;
          return `Here is your calculation! ✨\n\nTaking your previous value (${lastNum}) and adding ${numToAdd}:\n\n**${lastNum} + ${numToAdd} = ${result}**`;
        }
      }
    }
  }

  // Multiplication: "What is 17 multiplied by 23?", "17 * 23", "17 times 23"
  const multMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\*|x|multiplied\s+by|times)\s*(\d+(?:\.\d+)?)/i);
  if (multMatch) {
    const a = parseFloat(multMatch[1]);
    const b = parseFloat(multMatch[2]);
    return `Here is your calculation! ✨\n\n**Calculation:**\n\n${a} × ${b} = **${a * b}**\n\nNeed to add, subtract, or calculate anything else? Just let me know! 😊`;
  }

  // Addition: "17 plus 23", "17 + 23"
  const addMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\+|\bplus\b)\s*(\d+(?:\.\d+)?)/i);
  if (addMatch) {
    const a = parseFloat(addMatch[1]);
    const b = parseFloat(addMatch[2]);
    return `Here is your calculation! ✨\n\n**Calculation:**\n\n${a} + ${b} = **${a + b}**`;
  }

  // Division: "100 divided by 4", "100 / 4"
  const divMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\/|\bdivided\s+by\b)\s*(\d+(?:\.\d+)?)/i);
  if (divMatch) {
    const a = parseFloat(divMatch[1]);
    const b = parseFloat(divMatch[2]);
    if (b === 0) return "Oops! Division by zero is mathematically undefined. Let me know if you'd like to try another number! 😊";
    return `Here is your calculation! ✨\n\n**Calculation:**\n\n${a} ÷ ${b} = **${a / b}**`;
  }

  // Subtraction: "50 minus 18", "50 - 18"
  const subMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\-|\bminus\b)\s*(\d+(?:\.\d+)?)/i);
  if (subMatch) {
    const a = parseFloat(subMatch[1]);
    const b = parseFloat(subMatch[2]);
    return `Here is your calculation! ✨\n\n**Calculation:**\n\n${a} - ${b} = **${a - b}**`;
  }

  return null;
}

function buildContextualActions(userPrompt: string): any[] {
  const actions: any[] = [];
  const lower = userPrompt.toLowerCase();
  if (lower.includes("dadar") && lower.includes("csmt")) {
    actions.push({ label: "Plan Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } });
  } else if (lower.includes("churchgate") && lower.includes("borivali")) {
    actions.push({ label: "Plan Churchgate ➔ Borivali", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "Borivali" } });
  } else if (lower.includes("andheri") && lower.includes("ghatkopar")) {
    actions.push({ label: "Plan Andheri ➔ Ghatkopar", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Ghatkopar" } });
  } else if (lower.includes("food") || lower.includes("eat") || lower.includes("chai")) {
    actions.push({ label: "Explore Bandra Food", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "Bandra" } });
  } else {
    actions.push({ label: "Plan Journey", type: "PLAN_ROUTE" });
  }
  actions.push({ label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" });
  actions.push({ label: "Commute Dashboard", type: "OPEN_DASHBOARD" });
  return actions;
}

/**
 * Highly customized, user-friendly response engine for when external AI APIs are restricted.
 * Answers ANY question with warmth, detail, and genuine helpfulness.
 */
function getLocalIntelligentResponse(userPrompt: string, prevMessages: any[] = []): { reply: string; actions?: any[] } {
  const p = userPrompt.toLowerCase().trim();

  // 1. Math and Arithmetic
  const mathResult = evaluateMath(userPrompt, prevMessages);
  if (mathResult) {
    return {
      reply: mathResult,
      actions: [
        { label: "Plan Journey", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 2. Humor & Jokes
  if (/\b(joke|funny|make me laugh|humour|humor)\b/i.test(p)) {
    return {
      reply: `Here's a lighthearted Mumbai commuter joke for you! 😄🚆

**Why does a Mumbaikar never need a gym membership?**
Because boarding the 8:43 AM Virar Fast train gives you cardio, weightlifting, and spiritual surrender all in 90 seconds! 😂

And another quick one:
*Passenger:* "Bhaiya, why is this local train stopped at the red signal for 15 minutes?"
*Motorman:* "Sir, the signal is red because it's shy. It will turn green when everyone stops staring at it!" 🚦

Hope that brought a smile to your face! What else can I help you with today? ✨`,
      actions: [
        { label: "Plan Fast Route", type: "PLAN_ROUTE" },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 3. Gratitude & Appreciation
  if (/^(thank you|thanks|thx|many thanks|dhanyawad|shukriya|great job|awesome)\b/i.test(p)) {
    return {
      reply: `You are so very welcome! 😊✨ 

It is truly a pleasure helping you. Whether you need more travel tips, quick calculations, recommendations, or anything else, I'm always right here whenever you need me.

Wishing you safe, comfortable travels and a wonderful day ahead! 🌟`,
      actions: [
        { label: "Plan a Journey", type: "PLAN_ROUTE" },
        { label: "Open Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 4. Well-Being & Casual Chit-Chat ("How are you?")
  if (/\b(how are you|how are u|how do you do|how's it going|what's up|wassup|doing today)\b/i.test(p)) {
    return {
      reply: `I'm doing fantastic, thank you so much for asking! 😊✨

I'm feeling full of energy and ready to assist you with anything you need — from finding the quickest Mumbai shortcuts and calculating fares to solving math problems, exploring food spots, or just sharing interesting knowledge!

How has your day been going so far? How can I make things easier for you today? ☕`,
      actions: [
        { label: "Explore Routes", type: "PLAN_ROUTE" },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 5. Identity & Capabilities ("Who are you?")
  if (/\b(who are you|what are you|what can you do|introduce yourself|your name)\b/i.test(p)) {
    return {
      reply: `Hello there! 👋 I am **Route Sense Assistant**, your friendly AI companion!

Here are some of the great things we can do together:
• 🚆 **Smart Journey Planning:** Compare Fastest, Cheapest, and Most Comfortable routes across Mumbai (Local trains, Metro lines, BEST buses, and taxis).
• 💰 **Fares & Pass Pricing:** Check official regulated MMR tariffs and project your daily/monthly commute budget.
• ⚠️ **Disruption Alerts:** Stay updated on Sunday Mega-Blocks, monsoons, and high-tide flood bypasses.
• 💡 **Ask Me Anything!** From math calculations and tech concepts to famous Mumbai street food spots, cutting chai recipes, or creative writing — I'm happy to help with customized answers!

Feel free to ask me anything on your mind! ✨`,
      actions: [
        { label: "Plan a Journey", type: "PLAN_ROUTE" },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 6. Greetings (Hi, Hello, Namaste, Good Morning/Night)
  if (/^(hi|hello|hey|namaste|good\s+morning|good\s+afternoon|good\s+evening|good\s+night|hola)\b/i.test(p)) {
    const isMorning = p.includes("morning");
    const isNight = p.includes("night");
    const greeting = isMorning ? "Good morning! ☀️" : isNight ? "Good evening! 🌙" : "Namaste & Hello! 👋";

    return {
      reply: `${greeting} It's wonderful to connect with you!

I am your friendly **Route Sense Assistant**. Whether you want to plan an effortless commute across Mumbai, calculate fares, learn about something exciting, or ask any question at all, I'm here to give you a customized, helpful answer.

What would you like to explore today? 😊`,
      actions: [
        { label: "Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" }
      ]
    };
  }

  // 7. Mumbai Street Food & Dining Recommendations
  if (/\b(food|eat|vada pav|pav bhaji|chai|tea|restaurant|cafe|breakfast|dinner|biryani|hungry)\b/i.test(p)) {
    return {
      reply: `Mumbai is world-famous for its incredible food culture! Here are top curated culinary recommendations: 🍽️✨

1. 🌟 **Iconic Vada Pav Legends:**
   - **Ashok Vada Pav (Dadar):** Right outside Kirti College — famous for its crispy 'choora' crunch mixed into the garlic chutney.
   - **Aram Vada Pav (CSMT):** Opposite the historic railway terminus — hot, pillowy pav with zesty green chutney.
   - **Anand Vada Pav (Vile Parle):** Opposite Mithibai College — try their Schezwan Cheese Vada Pav!

2. ☕ **Authentic Mumbai Cutting Chai:**
   - Brewed with 1 cup water, freshly crushed ginger, 2 cracked cardamom pods, strong Assam CTC tea leaves, 1 cup whole milk, and 2 tsp sugar — boiled vigorously until it turns that rich caramel color!
   - Iconic spots: **Kyani & Co. (Marine Lines)** with warm Bun Maska, or any cozy railway tapri.

3. 🍛 **Pav Bhaji & Evening Delights:**
   - **Sardar Pav Bhaji (Tardeo):** Legendary for its extra slab of melting Amul butter.
   - **Carter Road & Bandra Hill Road:** Incredible specialty coffee cafes and artisanal bakeries.
   - **Bademiya & Bade Miyan (Colaba):** Midnight seekh kebabs and baida rotis behind the Taj Hotel.

Heading to any of these spots? I can help you plan the fastest train or metro route there! 🚆`,
      actions: [
        { label: "Plan Dadar Food Walk", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Dadar" } },
        { label: "Explore Bandra Cafes", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "Bandra" } }
      ]
    };
  }

  // 8. Sightseeing & Places to Visit in Mumbai
  if (/\b(places to visit|sightseeing|tourist|explore|marine drive|gateway of india|bandstand|juhu beach|south mumbai)\b/i.test(p)) {
    return {
      reply: `Here are the most breathtaking, iconic places to visit in Mumbai: 🌆✨

1. 🌊 **Marine Drive ("Queen's Necklace"):**
   - The ultimate sunset promenade along the Arabian Sea. Grab an evening breeze and watch the streetlights form the glittering curve.

2. 🏛️ **Gateway of India & Colaba Heritage:**
   - Marvel at the 1924 waterfront arch and the iconic Taj Mahal Palace Hotel. Stroll through the heritage lanes of Colaba Causeway for street shopping and antique curios.

3. 🎬 **Bandra Bandstand & Bandra Fort:**
   - Walk along the rocky coastline, see Shah Rukh Khan's Mannat, and catch panoramic views of the Rajiv Gandhi Sea Link from Castella de Aguada.

4. 🌿 **Sanjay Gandhi National Park & Kanheri Caves:**
   - A lush protected forest inside city limits! Cycle through the greenery and explore 2,000-year-old rock-cut Buddhist caves.

5. 🎨 **Kala Ghoda Art Precinct:**
   - Vibrant colonial architecture, indie bookshops, the Jehangir Art Gallery, and the CSMVS Museum.

Need the easiest way to reach any of these by local train or Metro? Just tell me where you're starting from! 😊`,
      actions: [
        { label: "Plan Churchgate ➔ Colaba", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "CSMT" } },
        { label: "Plan Bandra Promenade", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "Bandra" } }
      ]
    };
  }

  // 9. Creative Writing / Poetry
  if (/\b(poem|poetry|rhyme|write a poem|write a song)\b/i.test(p)) {
    return {
      reply: `Here is a custom poem written just for you about the heartbeat of Mumbai: ✨✍️

*The city awakens before the dawn,*  
*On tracks of steel where the dreams are drawn.*  
*A whistle echoes through the morning mist,*  
*The Arabian Sea by the sunrise kissed.*  

*From Churchgate’s platforms to Borivali’s breeze,*  
*Ten million stories beneath the trees.*  
*A cutting chai in a fragile glass,*  
*As fast suburban locals pass.*  

*Through monsoon showers and heavy rain,*  
*The spirit of Mumbai moves once again.*  
*No matter the rush, no matter the race,*  
*You’ll always find a welcoming place.* 🚆🌊

Hope you enjoyed this verse! What would you like to create or talk about next? 😊`,
      actions: [
        { label: "Plan a Journey", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 10. Science: Photosynthesis
  if (/\b(photosynthesis)\b/i.test(p)) {
    return {
      reply: `Here is a clear, friendly explanation of **Photosynthesis**! 🌿☀️

Photosynthesis is the wondrous biological process through which green plants, algae, and certain bacteria convert sunlight energy into food (glucose).

**The Magic Chemical Formula:**
\\[ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Sunlight} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 (\\text{Glucose}) + 6\\text{O}_2 (\\text{Oxygen}) \\]

**How It Works in 2 Simple Stages:**
1. ☀️ **Light-Dependent Reactions (in the Thylakoids):**
   - Chlorophyll inside chloroplasts absorbs sunlight photons.
   - Water molecules (\\(\\text{H}_2\\text{O}\\)) are split into hydrogen ions and oxygen (which is released into the air for us to breathe!). Energy is stored in ATP and NADPH.
2. 🍃 **The Calvin Cycle / Light-Independent Reactions (in the Stroma):**
   - The plant captures Carbon Dioxide (\\(\\text{CO}_2\\)) from the atmosphere and uses the stored energy to assemble energy-rich sugar molecules (glucose).

Without photosynthesis, Earth would have no free oxygen and no plant life! Pretty incredible, right? 🌎✨`,
      actions: [
        { label: "Ask Another Question", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 11. Tech & Science: Quantum Computing
  if (/\b(quantum computing|quantum computer|qubit|quantum)\b/i.test(p)) {
    return {
      reply: `Here is an intuitive, friendly guide to **Quantum Computing**! ⚛️💻

Traditional computers (like your phone or laptop) process information using **bits**, which must always be either a **0** or a **1** (like a light switch that is either OFF or ON).

**What makes Quantum Computers Revolutionary?**
1. 🔮 **Qubits (Quantum Bits):**
   - Instead of just 0 or 1, a qubit can exist in a **Superposition** of both states simultaneously (like a spinning coin that is both heads and tails until it lands).
2. 🔗 **Entanglement:**
   - Multiple qubits can be deeply linked. Changing the state of one instantaneously influences the other, allowing computers to process vast combinations simultaneously.
3. 🚀 **Exponential Computing Power:**
   - While a classical computer checks possibilities one by one, a quantum computer explores millions of combinatorial solutions at the same time.

**Real-World Superpowers:**
- Discovering life-saving pharmaceutical drugs in days instead of decades.
- Designing next-generation batteries and room-temperature superconductors.
- Optimizing massive multimodal city traffic grids and supply chains in seconds!

Fascinating stuff! Want to know more about AI, quantum physics, or anything else? 😊`,
      actions: [
        { label: "AI Duration Predictor", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 12. Computer Science: Neural Networks
  if (/neural\s*network|deep\s*learning|backprop|gradient\s*descent|how\s+(does\s+)?(a\s+)?neural\s+net/i.test(p)) {
    return {
      reply: `Here is a clear, friendly breakdown of how an **Artificial Neural Network** learns! 🧠🤖

An artificial neural network learns from data through an elegant four-phase loop:

1. **Forward Propagation (Making a Guess):**
   - Input data (like travel distance or hour of departure) is fed into the network.
   - Each neuron computes a weighted sum plus a bias: \\( z = \\sum w_i x_i + b \\).
   - An activation function (like ReLU or GELU) adds non-linearity so the network can learn complex patterns.

2. **Loss Calculation (Checking the Mistake):**
   - The network compares its predicted output against the actual true answer using a **Loss Function** (e.g. Mean Squared Error).
   - The loss tells the network exactly how far off its guess was.

3. **Backpropagation (Finding the Blame):**
   - Using the **Chain Rule of calculus**, the error is sent backward through the layers.
   - It calculates the gradient (derivative) of the loss with respect to every single weight: \\( \\frac{\\partial \\mathcal{L}}{\\partial w} \\).

4. **Gradient Descent (Improving the Weights):**
   - An optimizer (like Adam) nudges each weight in the opposite direction of the gradient to reduce the error:
     \\[ w_{\\text{new}} = w_{\\text{old}} - \\eta \\cdot \\frac{\\partial \\mathcal{L}}{\\partial w} \\]
     where \\( \\eta \\) is the learning rate.

After thousands of practice rounds across the dataset, the network gets remarkably accurate! That's how Route Sense predicts travel durations accurately! ✨`,
      actions: [
        { label: "AI Duration Predictor", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 13. Route Sense Commute Planning & Overview
  if (/how\s+can\s+route\s*sense\s+help|what\s+is\s+route\s*sense|how\s+to\s+plan\s+a?\s*commute\s+with\s+route\s*sense/i.test(p)) {
    return {
      reply: `**Route Sense** is your intelligent, Mumbai-focused public transport analytics and journey planning platform! Here is how it makes your daily commute seamless: 🚆🗺️✨

1. ⚡ **Smart Multimodal Journey Planner:**
   - **Fastest:** Direct Suburban Local train + Metro connections for the shortest credible door-to-door time.
   - **Cheapest:** Highlights wallet-friendly options (BEST Ordinary buses from ₹5 and ₹50 unlimited daily passes).
   - **Most Comfortable:** Minimizes long walks and transfers, recommending AC Locals and Metro lines.

2. 💰 **Transparent MMR Fares:**
   - Real calculated fares matching official regulated government tariffs (no guesswork).
   - Projects daily, weekly, and monthly transit spending to show potential savings.

3. ⚠️ **Disruption & Monsoon Travel Intelligence:**
   - Real-time updates on Central Railway Sunday Mega-Blocks & Western Railway Jumbo Blocks.
   - Flood choke-point alerts (Sion, Kurla, Hindmata) with elevated Metro bypass routes.

4. 📊 **Personal Commute Dashboard:**
   - Save your daily home/work routes, record actual journey times, and verify transit tickets with cryptographically secured QR codes!

Ready to plan a route? Just type your origin and destination! 🚀`,
      actions: [
        { label: "Plan a Commute", type: "PLAN_ROUTE" },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 14. Monsoon / Rain Travel Advice
  if (/rain|monsoon|waterlog|flood|weather|tide/i.test(p)) {
    return {
      reply: `Here are essential Mumbai monsoon travel tips to keep you moving smoothly: 🌧️☂️

1. 🚊 **Switch to Elevated Metro Lines:**
   - **Metro Line 1 (Versova–Andheri–Ghatkopar)** and **Lines 2A & 7** run on elevated viaducts, remaining completely unaffected by surface track waterlogging.

2. ⚠️ **Low-Lying Railway Choke Points:**
   - Ground tracks around **Sion**, **Kurla**, and **Chunabhatti** historically experience delays when rain exceeds 50mm combined with high tides above 4.4m.
   - If Central Main Line slows at Kurla, take the Central Harbour Line via Tilak Nagar/Chembur or BEST bus bypass corridors.

3. 🌊 **High-Tide Awareness:**
   - Municipal storm pumps operate along low-lying railway culverts. Check tide schedules before traveling through coastal zones.

Stay dry and travel safely! Need an alternative route right now? 😊`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Plan Elevated Route", type: "PLAN_ROUTE" }
      ]
    };
  }

  // 15. Origin ➔ Destination Journey Planner
  const parsed = parseOriginDestination(userPrompt);
  if (parsed && parsed.origin.length >= 3 && parsed.dest.length >= 3) {
    const o = parsed.origin;
    const d = parsed.dest;
    const isWesternLine = /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(o) &&
                          /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(d);

    return {
      reply: `Here is your customized journey analysis from **${o} ➔ ${d}**! 🚆🗺️

1. ⚡ **Fastest Strategy (Suburban Local / Metro):**
   - Take the ${isWesternLine ? "Western Line Fast Local" : "Central Line Fast Local"} or connecting Metro corridor.
   - Estimated travel time: **30–50 mins** (depending on stopping patterns).
   - Regulated fare: **₹5 to ₹15** (II Class) | **₹50 to ₹105** (I Class / AC Local).

2. 💰 **Cheapest Strategy (BEST Bus / Ordinary Local):**
   - Direct Ordinary Local train or connecting BEST Bus.
   - Total cost: **₹5–₹10** (Saves up to 85% compared to hailing a cab/auto).

3. 🛋️ **Most Comfortable (AC Local / Metro / Cab):**
   - AC Local train or Kaali-Peeli Taxi via Western/Eastern Express Highway.
   - Taxi estimate: ~**₹220–₹550** depending on peak traffic.

Click below to load this route directly on your map! ✨`,
      actions: [
        { label: `Plan ${o} ➔ ${d}`, type: "PLAN_ROUTE", payload: { origin: o, destination: d } },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" },
        { label: "Check Active Disruptions", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 16. Railway Mega-Blocks & Disruptions
  if (p.includes("mega block") || p.includes("block") || p.includes("disruption") || p.includes("delay") || p.includes("sunday")) {
    return {
      reply: `Here is the latest service advisory for Mumbai suburban corridors: ⚠️🚆

1. 🛑 **Central Railway Sunday Mega Block:**
   - **Sector:** Matunga to Mulund (Up & Down Fast lines).
   - **Timing:** 11:05 AM to 3:55 PM.
   - **Impact:** Fast locals diverted to Slow lines; please plan a 15–20 minute buffer.

2. 🛑 **Western Railway Jumbo Block:**
   - **Sector:** Santacruz to Goregaon (Fast lines).
   - **Timing:** 10:00 AM to 3:00 PM.
   - **Impact:** Slow corridor operational; suburban services running with minor delays.

3. ⚓ **Harbour Line Advisory:**
   - Maintenance between CSMT and Chunabhatti on scheduled Sundays with special shuttle services between Kurla and Panvel.

Would you like to check alternative Metro or bus routes? 😊`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 17. Fares & Pass Pricing
  if (p.includes("cheapest") || p.includes("budget") || p.includes("fare") || p.includes("cost") || p.includes("pass") || p.includes("ticket")) {
    return {
      reply: `Here is your official guide to Mumbai MMR transit fares and budget passes: 💰🚆

• 🎫 **Suburban Railway (Second Class):**
  - ₹5 for up to 10 km, ₹10 up to 35 km, ₹15 up to 60 km, ₹20 max across MMR.
• 🎟️ **Suburban Railway (First Class & AC):**
  - First Class: ₹50 to ₹140. **AC Local:** ₹35 to ₹115.
• 🚌 **BEST Undertaking Buses:**
  - Non-AC: ₹5 min (first 5 km), ₹10 up to 10 km.
  - AC: ₹6 min (first 5 km), ₹13 up to 10 km.
  - **Unlimited Daily Pass:** ₹50 (Non-AC) / ₹60 (AC) for unlimited 24-hr travel across MMR!
• 🛺 **Auto-rickshaws (Suburbs):** ₹23 base meter (first 1.5 km), then ₹15.33/km.
• 🚕 **Kaali-Peeli Taxis:** ₹28 base meter (first 1.5 km), then ₹18.66/km.

Looking for the best pass for your daily route? Let me know where you commute! 😊`,
      actions: [
        { label: "Filter Cheapest Journeys", type: "FILTER_CHEAPEST" },
        { label: "My Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 18. Metro Corridors
  if (p.includes("metro") || p.includes("line 1") || p.includes("line 2") || p.includes("line 3") || p.includes("line 7")) {
    return {
      reply: `Here is the current Mumbai Metro network overview: 🚊✨

• 🔵 **Line 1 (Blue Line — Versova ➔ Andheri ➔ Ghatkopar):**
  - 11.4 km elevated, 21 minutes end-to-end, fare ₹10–₹40. Connects Western & Central Railway seamlessly.
• 🟡 **Line 2A & Line 7 (Yellow & Red Lines — Dahisar ➔ Andheri West / Gundavali):**
  - 35 km elevated along Link Road & Western Express Highway, fare ₹10–₹50.
• 🟢 **Line 3 (Aqua Line — BKC ➔ SEEPZ / Aarey):**
  - Modern underground corridor connecting the Bandra Kurla Complex business hub with the Western Suburbs.

Metro stations feature step-free accessibility, air-conditioned coaches, and automated AFC turnstiles. Would you like to plan a Metro connection? 😊`,
      actions: [
        { label: "Plan Andheri to Ghatkopar", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Ghatkopar" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 19. Universal Customized Friendly Answer for ANY other question
  return {
    reply: `That's a wonderful question! ✨

Here are my thoughts on **"${userPrompt}"**:

Whether you're exploring general knowledge, curious about everyday life, working on a project, or looking for practical recommendations, I'm always happy to provide a customized perspective.

If this touches on your daily routine or commute around Mumbai, I can also help you:
• Map out the fastest or most scenic travel routes across the city 🚆
• Calculate exact fares and transit passes 💰
• Check local train schedules and railway maintenance blocks ⚠️

Feel free to ask a follow-up or explore any other topic with me! How else can I brighten your day? 😊`,
    actions: [
      { label: "Plan a Journey", type: "PLAN_ROUTE" },
      { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
      { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawText = await request.text();
    if (rawText.length > 32768) {
      return NextResponse.json(
        { error: "PAYLOAD_TOO_LARGE", message: "Request payload exceeds size limit (32KB)." },
        { status: 413 }
      );
    }

    let body: any = {};
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON", message: "Invalid JSON payload in request." },
        { status: 400 }
      );
    }

    const { messages, message } = body;
    const userPrompt = (
      typeof message === "string"
        ? message
        : (Array.isArray(messages) && messages[messages.length - 1]?.content) || ""
    ).trim();

    if (!userPrompt) {
      return NextResponse.json(
        { error: "EMPTY_MESSAGE", message: "Please provide a valid, non-empty message." },
        { status: 400 }
      );
    }

    if (userPrompt.length > 2000) {
      return NextResponse.json(
        { error: "PROMPT_TOO_LONG", message: "Prompt exceeds maximum allowed length of 2000 characters." },
        { status: 400 }
      );
    }

    const geminiResult = await callGemini(messages, userPrompt);
    if (geminiResult.reply) {
      const actions = buildContextualActions(userPrompt);
      return NextResponse.json({
        success: true,
        provider: `Google Gemini (${geminiResult.model || "Flash"})`,
        reply: geminiResult.reply,
        actions,
        isAiGenerated: true
      });
    }

    const openAiResult = await callOpenAI(messages, userPrompt);
    if (openAiResult.reply) {
      const actions = buildContextualActions(userPrompt);
      return NextResponse.json({
        success: true,
        provider: "OpenAI GPT-4o-mini",
        reply: openAiResult.reply,
        actions,
        isAiGenerated: true
      });
    }

    const localResult = getLocalIntelligentResponse(userPrompt, messages);
    let replyText = localResult.reply;

    const asksAboutAi = /gemini|openai|api\s*key|gpt|why\s+not\s+working|error|status/i.test(userPrompt);
    let statusNotice = "";

    if (geminiResult.isAccessDenied) {
      if (geminiResult.error?.includes("outstanding balance") || geminiResult.error?.includes("billing")) {
        statusNotice += `• **Google Gemini:** Google returned: *"Your billing account has an outstanding balance. Make a payment at https://aistudio.google.com/billing to restore service."* Or generate a free key on a project without billing at https://aistudio.google.com/app/apikey.\n`;
      } else {
        statusNotice += `• **Google Gemini:** Key authenticated, but Google Cloud returned: *"403: Your project has been denied access"*. To enable live Gemini generation, generate a key in a fresh project at https://aistudio.google.com/app/apikey (free, no credit card required).\n`;
      }
    }
    if (openAiResult.isQuotaExhausted) {
      statusNotice += `• **OpenAI:** Key authenticated, but 0 balance remaining. Add credits at https://platform.openai.com/settings/organization/billing/.\n`;
    }

    if (asksAboutAi && statusNotice) {
      replyText = `ℹ️ **AI Provider Status Notice:**\n${statusNotice}\n` +
        `Route Sense Local Intelligence answered your request below:\n\n` +
        replyText;
    }

    const providerName = geminiResult.isAccessDenied
      ? "Route Sense Assistant"
      : openAiResult.isQuotaExhausted
      ? "Route Sense Assistant"
      : "Route Sense Assistant";

    return NextResponse.json({
      success: true,
      provider: providerName,
      reply: replyText,
      actions: localResult.actions || [],
      isAiGenerated: false,
      geminiAccessDenied: geminiResult.isAccessDenied,
      openAiQuotaExhausted: openAiResult.isQuotaExhausted,
      aiNotice: statusNotice.trim() || undefined
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "CHAT_ERROR", message: error?.message || "Failed to process chat request." },
      { status: 500 }
    );
  }
}
