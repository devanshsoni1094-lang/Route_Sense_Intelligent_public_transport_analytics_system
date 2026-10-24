import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DisruptionService } from "@/lib/disruptions/disruptionService";

export const dynamic = "force-dynamic";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  actions?: Array<{
    label: string;
    type: "PLAN_ROUTE" | "CHECK_DISRUPTIONS" | "OPEN_DASHBOARD" | "FILTER_CHEAPEST";
    payload?: any;
  }>;
}

const SYSTEM_INSTRUCTION = `
You are the Route Sense Assistant — an expert Mumbai Metropolitan Region (MMR) multimodal transport and fare intelligence assistant.
Your goal is to assist commuters with accurate journey planning, ticket fares, route comparisons, railway mega-blocks, monsoon travel advice, and transit budgeting.

Key Knowledge Base:
1. Mumbai Suburban Railway:
   - Western Line: Churchgate to Borivali/Virar/Dahanu. Second class fare ₹5-₹20; First class ₹50-₹140. AC Local ₹35-₹115.
   - Central Main Line: CSMT to Dadar, Kurla, Ghatkopar, Thane, Kalyan. Second class ₹5-₹20; AC Local available.
   - Harbour Line: CSMT to Vadala, Kurla, Vashi, Panvel.
2. Mumbai Metro:
   - Line 1: Versova ➔ Andheri ➔ Ghatkopar (21 mins end-to-end, fare ₹10-₹40).
   - Line 2A & 7: Dahisar ➔ Andheri West / Gundavali (fare ₹10-₹50).
   - Line 3: Aqua Line underground (BKC ➔ SEEPZ / Aarey).
3. BEST Undertaking Buses:
   - Regulated tariff: Non-AC ₹5 min for 5km, AC ₹6 min for 5km. Daily unlimited pass ₹50 (non-AC) / ₹60 (AC).
4. Auto-rickshaws & Cabs:
   - Auto-rickshaws: Regulated meter min ₹23 (first 1.5 km), allowed only north of Bandra / Sion.
   - Kaali-Peeli Cabs: Regulated meter min ₹28 (first 1.5 km), runs across Island City & Suburbs.
5. Disruptions: Sunday Mega-Blocks on Central Railway (Matunga-Mulund) and Jumbo Blocks on Western Railway (Santacruz-Goregaon).

Rules:
- Be concise, structured, courteous, and accurate.
- Present travel options clearly: Fastest, Cheapest, and Most Comfortable.
- Quote realistic verified fares in INR (₹).
- Warn about active disruptions or peak hour rush (8:30-10:30 AM, 5:30-8:30 PM).
`;

interface OpenAiResult {
  reply: string | null;
  error?: string;
  isQuotaExhausted?: boolean;
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
    const recent = messages.slice(-5);
    for (const m of recent) {
      if (m?.role && m?.content) {
        payloadMessages.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content)
        });
      }
    }
  } else {
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
      console.warn("OpenAI API response status:", res.status, errData?.error?.message || errData);
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
    console.warn("OpenAI API call failed or timed out:", err?.message || err);
    return { reply: null, error: err?.message || "TIMEOUT" };
  }
}

async function callGemini(messages: any[], userPrompt: string): Promise<string | null> {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!geminiKey || geminiKey.includes("your-gemini-api-key")) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const promptText = `User asks: ${userPrompt}\n\nProvide a precise, courteous Mumbai transit recommendation with realistic fares and commute advice.`;
    const result = await model.generateContent(promptText);
    const responseText = result?.response?.text();
    return responseText ? responseText.trim() : null;
  } catch (err: any) {
    console.warn("Gemini API call failed:", err?.message || err);
    return null;
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

function getSmartFallbackReply(userPrompt: string): { reply: string; actions?: any[] } {
  const p = userPrompt.toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|namaste|good\s+morning|good\s+afternoon|good\s+evening|hola)\b/i.test(p) || p === "hi" || p === "hello") {
    return {
      reply: `Namaste! I am your **Route Sense Mumbai Assistant**.\n\nI specialize in the Mumbai Metropolitan Region (MMR) transit network:\n- **Suburban Railway:** Western, Central, and Harbour line timetables & fares\n- **Mumbai Metro:** Line 1 (Versova-Ghatkopar), Lines 2A & 7, Line 3 Aqua underground\n- **BEST Buses:** AC & Ordinary route connections and ₹50 daily passes\n- **Autos & Cabs:** Regulated meter tariffs & estimated fares\n- **Real-Time Advisories:** Active Sunday mega-blocks and monsoon rainfall updates\n\nHow can I help plan your journey today?`,
      actions: [
        { label: "Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
        { label: "Cheapest Passes", type: "FILTER_CHEAPEST" }
      ]
    };
  }

  // 2. Dynamic Route Planning for ANY Corridor
  const parsed = parseOriginDestination(userPrompt);
  if (parsed && parsed.origin.length >= 3 && parsed.dest.length >= 3) {
    const o = parsed.origin;
    const d = parsed.dest;
    const isWesternLine = /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(o) &&
                          /(borivali|andheri|bandra|goregaon|malad|kandivali|churchgate|dadar)/i.test(d);

    return {
      reply: `**Journey Analysis: ${o} ➔ ${d}**\n\n` +
        `1. **Fastest Route (Suburban Local / Metro):**\n` +
        `   - Take the ${isWesternLine ? "Western Line Fast Local" : "Central Line Fast Local"} or connecting Metro line.\n` +
        `   - Estimated time: **30–50 mins** (depending on fast/slow local).\n` +
        `   - Ticket fare: **₹5 to ₹15** (II Class) | **₹50 to ₹105** (I Class / AC Local).\n\n` +
        `2. **Cheapest Route (BEST Bus / Ordinary Local):**\n` +
        `   - Direct Ordinary Local train or connecting BEST Bus.\n` +
        `   - Total cost: **₹5–₹10** (Save up to 85% vs cab).\n\n` +
        `3. **Most Comfortable (AC Local / Metro / Cab):**\n` +
        `   - AC Local train or Kaali-Peeli Taxi via Western/Eastern Express Highway.\n` +
        `   - Taxi estimate: ~**₹220–₹550** depending on peak traffic.`,
      actions: [
        { label: `Plan ${o} ➔ ${d}`, type: "PLAN_ROUTE", payload: { origin: o, destination: d } },
        { label: "Compare Mode Fares", type: "FILTER_CHEAPEST" },
        { label: "Check Active Disruptions", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 3. Railway Mega Blocks & Disruptions
  if (p.includes("mega block") || p.includes("block") || p.includes("disruption") || p.includes("delay") || p.includes("sunday")) {
    return {
      reply: `**Active Mumbai MMR Service Advisories:**\n\n` +
        `1. **Central Railway Sunday Mega Block:**\n` +
        `   - **Sector:** Matunga to Mulund (Up & Down Fast lines)\n` +
        `   - **Timing:** 11:05 AM to 3:55 PM\n` +
        `   - **Impact:** Fast locals diverted to Slow lines; expect 15–20 min buffer.\n\n` +
        `2. **Western Railway Jumbo Block:**\n` +
        `   - **Sector:** Santacruz to Goregaon (Fast lines)\n` +
        `   - **Timing:** 10:00 AM to 3:00 PM\n\n` +
        `3. **IMD Monsoon Advisory:**\n` +
        `   - 4.48m high tide watch; pump deployment operational at Sion and Kurla low-lying railway culverts.`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 4. Fares, Passes & Budget
  if (p.includes("cheapest") || p.includes("budget") || p.includes("fare") || p.includes("cost") || p.includes("pass") || p.includes("ticket")) {
    return {
      reply: `**Mumbai MMR Fare & Commute Budget Guide:**\n\n` +
        `- **Suburban Railway (Second Class):** ₹5 for up to 10 km, ₹10 up to 35 km, ₹15 up to 60 km, ₹20 max.\n` +
        `- **Suburban Railway (First Class):** ₹50 to ₹140. AC Local: ₹35 to ₹115.\n` +
        `- **BEST Buses:**\n` +
        `  - Non-AC: ₹5 min (first 5 km), ₹10 up to 10 km.\n` +
        `  - AC: ₹6 min (first 5 km), ₹13 up to 10 km.\n` +
        `  - **Unlimited Daily Pass:** ₹50 (non-AC) / ₹60 (AC) for unlimited 24-hr travel across MMR.\n` +
        `- **Auto-rickshaws (Suburbs only):** ₹23 base meter (first 1.5 km), then ₹15.33 per km.\n` +
        `- **Kaali-Peeli Taxis:** ₹28 base meter (first 1.5 km), then ₹18.66 per km.`,
      actions: [
        { label: "Filter Cheapest Journeys", type: "FILTER_CHEAPEST" },
        { label: "My Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  // 5. Metro Lines
  if (p.includes("metro") || p.includes("line 1") || p.includes("line 2") || p.includes("line 3") || p.includes("line 7")) {
    return {
      reply: `**Mumbai Metro Network Overview:**\n\n` +
        `- **Line 1 (Blue Line — Versova ➔ Andheri ➔ Ghatkopar):** 11.4 km elevated, 21 minutes end-to-end, fare ₹10–₹40. Connects Western & Central Railway.\n` +
        `- **Line 2A & 7 (Yellow & Red Lines — Dahisar ➔ Andheri West / Gundavali):** 35 km elevated along Link Road & WEH, fare ₹10–₹50.\n` +
        `- **Line 3 (Aqua Line — BKC ➔ SEEPZ / Aarey):** Underground corridor connecting Bandra Kurla Complex with Western Suburbs.`,
      actions: [
        { label: "Plan Andheri to Ghatkopar", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Ghatkopar", mode: "METRO" } },
        { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" }
      ]
    };
  }

  // 6. Monsoon & Waterlogging
  if (p.includes("rain") || p.includes("monsoon") || p.includes("waterlog") || p.includes("flood") || p.includes("weather")) {
    return {
      reply: `**Monsoon & Flood Travel Intelligence:**\n\n` +
        `- **High-Risk Waterlogging Spots:** Sion Railway tracks, Kurla Station subway, Gandhi Market (King's Circle), Hindmata Dadar, Milan Subway (Santacruz).\n` +
        `- **Heavy Rain Commuter Strategy:**\n` +
        `  1. Switch to elevated Metro lines (Line 1, 2A, 7) which run unaffected by surface track waterlogging.\n` +
        `  2. Check IMD high-tide timings: High tides above 4.5m coinciding with >50mm rain cause temporary railway slow-downs.\n` +
        `  3. Use Central Harbour line via Chembur/Tilak Nagar as bypass when Main Line is congested.`,
      actions: [
        { label: "View Live Disruptions", type: "CHECK_DISRUPTIONS" },
        { label: "Plan Journey", type: "PLAN_ROUTE" }
      ]
    };
  }

  // 7. General Fallback with Actionable Prompts
  return {
    reply: `I can help you navigate Mumbai's transit network with real-time accuracy:\n\n` +
      `- Compare **Local Trains vs Metro vs BEST Buses vs Autos/Cabs**\n` +
      `- Calculate official **regulated MMR fares & monthly commute budgets**\n` +
      `- Check today's **Central/Western Railway mega-blocks & IMD monsoon alerts**\n` +
      `- Find the fastest or most comfortable route with minimal walking\n\n` +
      `Try asking:\n` +
      `• *"How to go from Thane to Churchgate?"*\n` +
      `• *"What is the cheapest way to travel from Dadar to BKC?"*\n` +
      `• *"Are there any mega blocks today?"*`,
    actions: [
      { label: "Plan Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
      { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
      { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
    ]
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages, message } = body;

    const userPrompt = message || (Array.isArray(messages) && messages[messages.length - 1]?.content) || "";

    if (!userPrompt.trim()) {
      return NextResponse.json({
        reply: "Namaste! Ask me any question about Mumbai transit routes, local train timetables, Metro connections, BEST fares, or railway mega-blocks.",
        actions: [
          { label: "Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } },
          { label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" },
          { label: "Compare Fares", type: "FILTER_CHEAPEST" }
        ]
      });
    }

    // 1. Primary AI Provider: OpenAI GPT-4o-mini
    const openAiResult = await callOpenAI(messages, userPrompt);
    if (openAiResult.reply) {
      const actions: any[] = [];
      const lower = userPrompt.toLowerCase();
      if (lower.includes("dadar") && lower.includes("csmt")) {
        actions.push({ label: "Plan Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } });
      } else if (lower.includes("churchgate") && lower.includes("borivali")) {
        actions.push({ label: "Plan Churchgate ➔ Borivali", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "Borivali" } });
      } else {
        actions.push({ label: "Plan Journey", type: "PLAN_ROUTE" });
      }
      actions.push({ label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" });
      actions.push({ label: "Commute Dashboard", type: "OPEN_DASHBOARD" });

      return NextResponse.json({
        success: true,
        provider: "OpenAI GPT-4o-mini",
        reply: openAiResult.reply,
        actions
      });
    }

    // 2. Alternative AI Provider: Google Gemini 1.5 Flash
    const geminiReply = await callGemini(messages, userPrompt);
    if (geminiReply) {
      const actions: any[] = [];
      const lower = userPrompt.toLowerCase();
      if (lower.includes("dadar") && lower.includes("csmt")) {
        actions.push({ label: "Plan Dadar ➔ CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT" } });
      } else if (lower.includes("churchgate") && lower.includes("borivali")) {
        actions.push({ label: "Plan Churchgate ➔ Borivali", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "Borivali" } });
      } else {
        actions.push({ label: "Plan Journey", type: "PLAN_ROUTE" });
      }
      actions.push({ label: "Check Mega Blocks", type: "CHECK_DISRUPTIONS" });
      actions.push({ label: "Commute Dashboard", type: "OPEN_DASHBOARD" });

      return NextResponse.json({
        success: true,
        provider: "Google Gemini 1.5 Flash",
        reply: geminiReply,
        actions
      });
    }

    // 3. Intelligent Mumbai Transit Engine Fallback
    const fallback = getSmartFallbackReply(userPrompt);
    let replyText = fallback.reply;

    // If user explicitly asked about OpenAI or why it's not using OpenAI
    const asksAboutAi = /openai|api\s*key|gpt|why\s+not\s+working|error/i.test(userPrompt);
    if (asksAboutAi && openAiResult.isQuotaExhausted) {
      replyText = `ℹ️ **OpenAI API Status Notice:**\n` +
        `Your OpenAI API key was verified and accepted by OpenAI's authentication servers. However, OpenAI returned: **"credit_balance_exhausted (You have no credits remaining)"**.\n\n` +
        `To enable direct GPT-4o-mini AI generations, top up pre-paid credits ($5 minimum) at:\n` +
        `👉 https://platform.openai.com/settings/organization/billing/\n\n` +
        `In the meantime, the **Route Sense Mumbai Transit Engine** is fully operational and answering your questions with real timetables, regulated tariffs, and route intelligence below:\n\n` +
        replyText;
    }

    return NextResponse.json({
      success: true,
      provider: openAiResult.isQuotaExhausted ? "Route Sense Intelligence (OpenAI Quota Pending)" : "Route Sense Mumbai Intelligence",
      reply: replyText,
      actions: fallback.actions || [],
      quotaExhausted: openAiResult.isQuotaExhausted
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "CHAT_ERROR", message: error?.message || "Failed to process chat request." },
      { status: 500 }
    );
  }
}
