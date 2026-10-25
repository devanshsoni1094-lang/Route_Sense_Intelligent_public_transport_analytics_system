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

const SYSTEM_INSTRUCTION = `You are Route Sense Assistant — the official conversational AI guide for "Route Sense: Intelligent Public Transport Analytics System", focusing on Mumbai and the Mumbai Metropolitan Region (MMR).

Your Responsibilities:
1. Core Mumbai Transport Expertise:
   - Provide realistic, accurate multimodal route comparisons across:
     • Mumbai Suburban Railway: Western Line (Churchgate–Borivali/Virar), Central Main Line (CSMT–Dadar–Kalyan), Harbour Line (CSMT–Vashi–Panvel). Second class ₹5–₹20, First class ₹50–₹140, AC Local ₹35–₹115.
     • Mumbai Metro: Line 1 (Versova–Andheri–Ghatkopar, ₹10–₹40), Lines 2A & 7 (Dahisar–Andheri West/Gundavali, ₹10–₹50), Line 3 Aqua underground (BKC–SEEPZ/Aarey).
     • BEST Buses: Regulated tariff (Non-AC ₹5 min, AC ₹6 min for 5km; ₹50/₹60 unlimited daily passes).
     • Auto-rickshaws (suburban only, meter min ₹23) & Kaali-Peeli Taxis (meter min ₹28).
   - Compare travel options under three strategies: Fastest, Cheapest, and Most Comfortable.
   - Advise on active disruptions: Sunday Central Railway Mega-Blocks (Matunga–Mulund), Western Railway Jumbo Blocks (Santacruz–Goregaon), and monsoon flood spots (Sion, Kurla, Hindmata).
2. General Assistance & Versatility:
   - When users ask general questions (e.g., mathematics, computer science, algorithms, neural networks, or reasoning), answer clearly, accurately, and politely.
   - Do NOT force unrelated Mumbai transit answers onto general questions.
3. Conversational Context & Memory:
   - Maintain multi-turn context. When users ask follow-up questions (e.g. "And add 9 to it?" or "What about the cheapest option for that?"), use the conversation history to answer naturally.
4. Grounded Truth:
   - Never invent non-existent bus routes, train stations, or live vehicle tracking coordinates.
   - If specific real-time vehicle GPS feeds are unavailable, state that honestly.`;

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
        msg.includes("blocked")
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
        temperature: 0.6,
        max_tokens: 600
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
          return `Taking the previous value (${lastNum}) and adding ${numToAdd}:\n\n**${lastNum} + ${numToAdd} = ${result}**`;
        }
      }
    }
  }

  const multMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\*|x|multiplied\s+by|times)\s*(\d+(?:\.\d+)?)/i);
  if (multMatch) {
    const a = parseFloat(multMatch[1]);
    const b = parseFloat(multMatch[2]);
    return `**Calculation:**\n\n${a} × ${b} = **${a * b}**`;
  }

  const addMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\+|\bplus\b)\s*(\d+(?:\.\d+)?)/i);
  if (addMatch) {
    const a = parseFloat(addMatch[1]);
    const b = parseFloat(addMatch[2]);
    return `**Calculation:**\n\n${a} + ${b} = **${a + b}**`;
  }

  const divMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\/|\bdivided\s+by\b)\s*(\d+(?:\.\d+)?)/i);
  if (divMatch) {
    const a = parseFloat(divMatch[1]);
    const b = parseFloat(divMatch[2]);
    if (b === 0) return "Division by zero is undefined.";
    return `**Calculation:**\n\n${a} ÷ ${b} = **${a / b}**`;
  }

  const subMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:\-|\bminus\b)\s*(\d+(?:\.\d+)?)/i);
  if (subMatch) {
    const a = parseFloat(subMatch[1]);
    const b = parseFloat(subMatch[2]);
    return `**Calculation:**\n\n${a} - ${b} = **${a - b}**`;
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
  } else {
    actions.push({ label: "Plan Journey", type: "PLAN_ROUTE" });
  }
  actions.push({ label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" });
  actions.push({ label: "Commute Dashboard", type: "OPEN_DASHBOARD" });
  return actions;
}

function getLocalIntelligentResponse(userPrompt: string, prevMessages: any[] = []): { reply: string; actions?: any[] } {
  const p = userPrompt.toLowerCase().trim();

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

  if (/neural\s*network|deep\s*learning|backprop|gradient\s*descent|how\s+(does\s+)?(a\s+)?neural\s+net/i.test(p)) {
    return {
      reply: `An artificial neural network learns through an iterative optimization process consisting of four primary phases:

1. **Forward Propagation (Inference):**
   - Input features (such as transit distance, time of day, passenger load) pass into the input layer.
   - Each neuron in hidden layers computes a weighted sum of inputs plus bias: \( z = \\sum w_i x_i + b \).
   - This value passes through a non-linear activation function (such as ReLU, GELU, or Sigmoid) to introduce non-linearity.

2. **Loss Computation:**
   - The predicted output is evaluated against the ground-truth target using an objective loss function (such as Mean Squared Error for duration regression, or Cross-Entropy for classification).
   - The loss quantifies the total prediction error.

3. **Backpropagation (Gradient Computation):**
   - Using the **Chain Rule of calculus**, the error is propagated backward through the network layers.
   - It computes the partial derivatives (gradients) of the loss with respect to each weight and bias: \( \\frac{\\partial \\mathcal{L}}{\\partial w} \).

4. **Parameter Optimization (Gradient Descent):**
   - An optimizer (such as Adam, RMSprop, or SGD) updates the weights in the opposite direction of the gradient:
     \\[ w_{\\text{new}} = w_{\\text{old}} - \\eta \\cdot \\frac{\\partial \\mathcal{L}}{\\partial w} \\]
     where \( \\eta \) is the learning rate.

Through repeated epochs across the dataset, the network minimizes loss and generalizes to unseen travel conditions.`,
      actions: [
        { label: "AI Duration Predictor", type: "PLAN_ROUTE" },
        { label: "Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  if (/how\s+can\s+route\s*sense\s+help|what\s+is\s+route\s*sense|how\s+to\s+plan\s+a?\s*commute\s+with\s+route\s*sense/i.test(p)) {
    return {
      reply: `**Route Sense** is an intelligent multimodal public transport analytics and journey planning platform built specifically for the Mumbai Metropolitan Region (MMR). Here is how it streamlines your daily commute:

1. **Smart Multimodal Journey Planner:**
   - **Fastest Strategy:** Door-to-door journey prioritized via Mumbai Suburban Rail (Western, Central, Harbour) and Metro lines (1, 2A, 7, 3).
   - **Cheapest Strategy:** Highlights regulated low-cost transit (BEST Ordinary buses at ₹5 min, II Class trains at ₹5–₹15, and ₹50 unlimited daily passes).
   - **Most Comfortable Strategy:** Minimizes walking and transfers, prioritizing AC Local trains, Metro connections, and regulated Kaali-Peeli/Auto first/last-mile links.

2. **Fare & Commute Budget Intelligence:**
   - Real calculated fares using official regulated MMR tariffs.
   - Projects daily, weekly, and monthly transit spending to show potential savings.

3. **Disruption & Monsoon Travel Intelligence:**
   - Railway maintenance schedules (Sunday Central Mega-Blocks & Western Jumbo Blocks).
   - High-tide and monsoon flood alerts at waterlogging-prone spots (Sion, Kurla, Hindmata) with elevated Metro bypass recommendations.

4. **Personal Commute Dashboard:**
   - Save frequently used routes, record actual journey times, and verify transit tickets with authentic cryptographic QR validation.`,
      actions: [
        { label: "Plan a Commute", type: "PLAN_ROUTE" },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  if (/rain|monsoon|waterlog|flood|weather|tide/i.test(p)) {
    return {
      reply: `**Monsoon & Flood Commuter Strategy (Mumbai MMR):**

1. **Elevated Metro Priority:**
   - Switch to elevated **Metro Line 1 (Versova–Andheri–Ghatkopar)** and **Lines 2A & 7** during heavy downpours. They run elevated on viaducts and remain unaffected by ground track waterlogging.

2. **Railway Vulnerability Choke-Points:**
   - Track flooding historically impacts **Sion**, **Kurla**, and **Chunabhatti** during rainfall exceeding 50mm combined with high tides above 4.4 meters.
   - If Central Main Line slows at Kurla, utilize the Central Harbour Line via Tilak Nagar/Chembur or BEST bus bypass corridors.

3. **High-Tide Caution:**
   - Always verify municipal storm pump operations and IMD radar advisories before departing low-lying stations.`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Plan Elevated Route", type: "PLAN_ROUTE" }
      ]
    };
  }

  const parsed = parseOriginDestination(userPrompt);
  if (parsed && parsed.origin.length >= 3 && parsed.dest.length >= 3) {
    const o = parsed.origin;
    const d = parsed.dest;
    const isWesternLine = /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(o) &&
                          /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(d);

    return {
      reply: `**Journey Analysis: ${o} ➔ ${d}**

1. **Fastest Route (Suburban Local / Metro):**
   - Take the ${isWesternLine ? "Western Line Fast Local" : "Central Line Fast Local"} or connecting Metro line.
   - Estimated time: **30–50 mins** (depending on fast/slow local stopping pattern).
   - Ticket fare: **₹5 to ₹15** (II Class) | **₹50 to ₹105** (I Class / AC Local).

2. **Cheapest Route (BEST Bus / Ordinary Local):**
   - Direct Ordinary Local train or connecting BEST Bus.
   - Total cost: **₹5–₹10** (Save up to 85% compared to cab/auto).

3. **Most Comfortable (AC Local / Metro / Cab):**
   - AC Local train or Kaali-Peeli Taxi via Western/Eastern Express Highway.
   - Taxi estimate: ~**₹220–₹550** depending on peak traffic.`,
      actions: [
        { label: `Plan ${o} ➔ ${d}`, type: "PLAN_ROUTE", payload: { origin: o, destination: d } },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" },
        { label: "Check Active Disruptions", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  if (p.includes("mega block") || p.includes("block") || p.includes("disruption") || p.includes("delay") || p.includes("sunday")) {
    return {
      reply: `**Active Mumbai MMR Service Advisories:**

1. **Central Railway Sunday Mega Block:**
   - **Sector:** Matunga to Mulund (Up & Down Fast lines)
   - **Timing:** 11:05 AM to 3:55 PM
   - **Impact:** Fast locals diverted to Slow lines; expect 15–20 min buffer.

2. **Western Railway Jumbo Block:**
   - **Sector:** Santacruz to Goregaon (Fast lines)
   - **Timing:** 10:00 AM to 3:00 PM
   - **Impact:** Slow corridor operational; suburban services running with minor delays.

3. **Harbour Line Advisory:**
   - Regular maintenance between CSMT and Chunabhatti on select Sundays. Special services operate between Kurla and Panvel.`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  if (p.includes("cheapest") || p.includes("budget") || p.includes("fare") || p.includes("cost") || p.includes("pass") || p.includes("ticket")) {
    return {
      reply: `**Mumbai MMR Regulated Fare & Pass Structure:**

- **Suburban Railway (Second Class):** ₹5 (up to 10 km), ₹10 (up to 35 km), ₹15 (up to 60 km), ₹20 max across MMR.
- **Suburban Railway (First Class):** ₹50 to ₹140. **AC Local:** ₹35 to ₹115.
- **BEST Undertaking Buses:**
  • Non-AC: ₹5 min (first 5 km), ₹10 up to 10 km.
  • AC: ₹6 min (first 5 km), ₹13 up to 10 km.
  • **Unlimited Daily Pass:** ₹50 (Non-AC) / ₹60 (AC) for unlimited 24-hr travel.
- **Auto-rickshaws (Suburbs):** ₹23 base meter (first 1.5 km), then ₹15.33 per km.
- **Kaali-Peeli Cabs:** ₹28 base meter (first 1.5 km), then ₹18.66 per km.`,
      actions: [
        { label: "Filter Cheapest Journeys", type: "FILTER_CHEAPEST" },
        { label: "My Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  if (p.includes("metro") || p.includes("line 1") || p.includes("line 2") || p.includes("line 3") || p.includes("line 7")) {
    return {
      reply: `**Mumbai Metro Network Overview:**

- **Line 1 (Blue Line — Versova ➔ Andheri ➔ Ghatkopar):** 11.4 km elevated, 21 minutes end-to-end, fare ₹10–₹40. Connects Western & Central Railway lines.
- **Line 2A & 7 (Yellow & Red Lines — Dahisar ➔ Andheri West / Gundavali):** 35 km elevated along Link Road & Western Express Highway, fare ₹10–₹50.
- **Line 3 (Aqua Line — BKC ➔ SEEPZ / Aarey):** Phase 1 underground corridor linking Bandra Kurla Complex with the Western Suburbs.`,
      actions: [
        { label: "Plan Andheri to Ghatkopar", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Ghatkopar" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  if (/^(hi|hello|hey|namaste|good\s+morning|good\s+afternoon|good\s+evening|hola)\b/i.test(p) || p === "hi" || p === "hello") {
    return {
      reply: `Namaste! I am your **Route Sense Assistant**.

I can assist you with:
- Comparing **Suburban Local Trains vs Metro vs BEST Buses vs Autos/Cabs**
- Checking **regulated MMR fares and calculating daily/monthly commute budgets**
- Real-time **Central/Western Railway mega-blocks and monsoon rainfall updates**
- Multimodal route optimization under **Fastest, Cheapest, or Most Comfortable** criteria

How can I help plan your journey today?`,
      actions: [
        { label: "Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" }
      ]
    };
  }

  return {
    reply: `I understand your inquiry: "${userPrompt}".

As your **Route Sense Assistant**, I can assist with journey planning across Mumbai & MMR, fare breakdowns, railway service updates, or general reasoning. 

For the most precise route planning, you can specify your origin and destination (e.g. *"How to travel from Thane to Churchgate?"*) or ask about specific fares, passes, or today's mega blocks.`,
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
      statusNotice += `• **Google Gemini:** Key authenticated, but Google Cloud returned: *"403: Your project has been denied access"*. To enable live Gemini generation, generate a key in a fresh project at https://aistudio.google.com/app/apikey (free, no credit card required).\n`;
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
      ? "Route Sense Local Intelligence (Gemini Key 403 Restricted)"
      : openAiResult.isQuotaExhausted
      ? "Route Sense Local Intelligence (OpenAI Quota Pending)"
      : "Route Sense Local Intelligence";

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
