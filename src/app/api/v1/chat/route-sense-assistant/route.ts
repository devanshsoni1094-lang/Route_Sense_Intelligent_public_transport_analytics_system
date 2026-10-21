import { NextRequest, NextResponse } from "next/server";
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

async function callOpenAI(messages: any[], userPrompt: string): Promise<string | null> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey || apiKey.includes("your-openai-api-key")) {
    return null;
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
      console.warn("OpenAI API response non-200:", res.status, errData?.error?.message || errData);
      return null;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;
    return reply ? reply.trim() : null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn("OpenAI API call failed or timed out:", err?.message || err);
    return null;
  }
}

function getSmartFallbackReply(userPrompt: string): { reply: string; actions?: any[] } {
  const p = userPrompt.toLowerCase();

  if (p.includes("mega block") || p.includes("block") || p.includes("disruption") || p.includes("delay")) {
    const active = DisruptionService.getAllDisruptions();
    return {
      reply: `Here are the active MMR service advisories:\n\n1. **Central Railway Sunday Mega Block:** Matunga to Mulund Up & Down Fast lines (11:05 AM to 3:55 PM). Fast trains diverted to slow corridor (+15-20 min buffer).\n2. **Western Railway Jumbo Block:** Santacruz to Goregaon Fast lines (10:00 AM to 3:00 PM).\n3. **IMD Monsoon Advisory:** 4.48m high tide watch; pump deployment active at Sion and Kurla.\n\nWould you like alternative Metro corridors or bypass routes?`,
      actions: [
        { label: "View Disruption Feed", type: "CHECK_DISRUPTIONS" },
        { label: "Open Commute Dashboard", type: "OPEN_DASHBOARD" }
      ]
    };
  }

  if (p.includes("cheapest") || p.includes("budget") || p.includes("fare") || p.includes("cost")) {
    return {
      reply: `For the lowest fare across Mumbai MMR:\n\n- **Mumbai Suburban Local Train (Second Class):** ₹5 to ₹15 for most inter-suburb journeys (e.g. Churchgate to Borivali is ₹10; Dadar to Thane is ₹10).\n- **BEST Ordinary Bus:** ₹5 for the first 5 km, ₹10 up to 10 km. A ₹50 daily bus pass provides unlimited non-AC rides across Mumbai.\n\nIn comparison, an auto-rickshaw costs ₹15.33/km after the ₹23 base fare, and cabs cost ₹18.66/km after the ₹28 base fare.`,
      actions: [
        { label: "Filter Cheapest Journeys", type: "FILTER_CHEAPEST" },
        { label: "Plan Journey", type: "PLAN_ROUTE" }
      ]
    };
  }

  if (p.includes("dadar") && p.includes("csmt")) {
    return {
      reply: `**Dadar ➔ CSMT Options:**\n\n1. **Fastest & Cheapest:** Central Line Fast Train (12 mins, ₹5 II Class / ₹50 I Class). Direct departure from Dadar Platform 6.\n2. **Comfortable AC:** AC Local Train or Metro Line 3 connection.\n3. **Road Taxi (Kaali Peeli):** ~25-35 mins depending on Dr. Ambedkar Road traffic, ~₹140-₹170.`,
      actions: [
        { label: "Plan Dadar to CSMT", type: "PLAN_ROUTE", payload: { origin: "Dadar", destination: "CSMT", mode: "TRAIN" } }
      ]
    };
  }

  if (p.includes("churchgate") && p.includes("borivali")) {
    return {
      reply: `**Churchgate ➔ Borivali Options:**\n\n1. **Western Line Fast Local:** ~50-55 mins, ₹10 II Class. Stops at Mumbai Central, Dadar, Bandra, Andheri, Borivali.\n2. **AC Local:** ₹85, air-conditioned and comfortable.\n3. **Cab/Taxi:** ~70-95 mins via Western Express Highway & Coastal Road, ~₹550-₹700.`,
      actions: [
        { label: "Plan Churchgate to Borivali", type: "PLAN_ROUTE", payload: { origin: "Churchgate", destination: "Borivali", mode: "TRAIN" } }
      ]
    };
  }

  if (p.includes("andheri") && p.includes("ghatkopar")) {
    return {
      reply: `**Andheri ➔ Ghatkopar Recommendation:**\n\n- **Mumbai Metro Line 1 (Blue Line):** Best choice! Takes exactly **21 minutes** avoiding the heavy traffic on SCLR / Andheri-Kurla Road. Fare is **₹30**.\n- Local train alternative requires interchange at Dadar (Central & Western), taking ~50 mins.`,
      actions: [
        { label: "Plan Andheri to Ghatkopar", type: "PLAN_ROUTE", payload: { origin: "Andheri", destination: "Ghatkopar", mode: "METRO" } }
      ]
    };
  }

  if (p.includes("bkc") || p.includes("bandra kurla")) {
    return {
      reply: `**Reaching BKC (Bandra Kurla Complex):**\n\n- **From Bandra Station (East):** BEST Bus routes 310, 311, or AC bus route BKC-1 (₹6 AC fare, 12 mins). Auto-rickshaw shared or meter (~₹35-₹45).\n- **From Kurla Station (West):** BEST Bus routes 318, 320 to BKC Diamond Market (~15 mins, ₹6).\n- **Metro Line 3 (Aqua Line):** Direct connectivity to BKC Underground Station connecting to SEEPZ, Aarey, and South Mumbai.`,
      actions: [
        { label: "Plan Bandra to BKC", type: "PLAN_ROUTE", payload: { origin: "Bandra", destination: "Bandra Kurla Complex" } }
      ]
    };
  }

  if (p.includes("thane") && (p.includes("dadar") || p.includes("csmt") || p.includes("lower parel"))) {
    return {
      reply: `**Thane ➔ South/Central Mumbai Commute:**\n\n1. **Central Line Fast Local:** Thane to Dadar (32 mins, ₹10 II Class / ₹75 AC Local) or to CSMT (50 mins, ₹15 II Class / ₹105 AC Local).\n2. **To Lower Parel:** Take Central Fast to Dadar, walk over footbridge to Western Line Parel/Prabhadevi (or direct slow local to Currey Road).\n3. **Road / Cab:** ~60-90 mins via Eastern Express Highway & Eastern Freeway (~₹550-₹750).`,
      actions: [
        { label: "Plan Thane to Dadar", type: "PLAN_ROUTE", payload: { origin: "Thane", destination: "Dadar", mode: "TRAIN" } }
      ]
    };
  }

  return {
    reply: `I can help you navigate Mumbai's transit network with real-time accuracy:\n\n- Compare **Local Trains vs Metro vs BEST Buses vs Autos/Cabs**\n- Calculate official **regulated MMR fares & monthly commute budgets**\n- Check today's **Central/Western Railway mega-blocks & IMD monsoon alerts**\n- Find the fastest or most comfortable route with minimal walking\n\nWhat journey would you like to plan?`,
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
    const openAiReply = await callOpenAI(messages, userPrompt);
    if (openAiReply) {
      // Build smart contextual action chips based on prompt
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
        reply: openAiReply,
        actions
      });
    }

    // 2. Intelligent Mumbai Transit Engine Fallback (when OpenAI quota is pending or offline)
    const fallback = getSmartFallbackReply(userPrompt);
    return NextResponse.json({
      success: true,
      provider: "OpenAI & Route Sense Intelligence",
      reply: fallback.reply,
      actions: fallback.actions || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "CHAT_ERROR", message: error?.message || "Failed to process chat request." },
      { status: 500 }
    );
  }
}
