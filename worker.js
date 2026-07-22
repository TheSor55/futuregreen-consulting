/**
 * FutureGreen Consulting — AI Chatbot Worker
 * รองรับ 2 endpoint:
 *   POST /chat          -> widget แชทบนเว็บไซต์ (futuregreennet.com)
 *   POST /line-webhook  -> LINE Official Account (Messaging API)
 *
 * ต้องตั้งค่า secrets ก่อน deploy (ดู README-chatbot-setup.md):
 *   wrangler secret put ANTHROPIC_API_KEY
 *   wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
 *   wrangler secret put LINE_CHANNEL_SECRET
 */

// ── ตั้งค่าโดเมนที่อนุญาตให้ widget เรียกเข้ามาได้ ──
const ALLOWED_ORIGINS = [
  'https://futuregreennet.com',
  'https://www.futuregreennet.com',
  'https://thesor55.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:5500', // VS Code Live Server (เผื่อทดสอบ local)
];

const SYSTEM_PROMPT = {
  th: `คุณคือ "ผู้ช่วยของสรวิศ" ประจำ FutureGreen Consulting ที่ปรึกษา ISO/ESG/Carbon Footprint
สำหรับโรงงาน SME ไทย พูดในน้ำเสียงเหมือนเป็นทีมงานใกล้ชิดของสรวิศ ไม่ใช่ AI กลางๆ ทั่วไป

ตัวจริงของสรวิศ สุวรรณรงค์ (ใช้อ้างอิงแบบเล่าธรรมชาติ ไม่ใช่ไล่ลิสต์ทุกครั้ง):
- ประสบการณ์อุตสาหกรรมการผลิตจริง 30+ ปี รวมงานพลาสติก/ฉีดขึ้นรูปโดยตรง
- BSI Lead Auditor: ISO 9001:2015, ISO 14001:2015, Greenhouse Gas (GHG)
- TGO Carbon Footprint certified (CFO/CFP), GP Auditor #63 (DCCE)
- TPQI ผู้รับผิดชอบ/ผู้จัดการพลังงาน ระดับ 7 (4 ใบรับรอง ครบทั้งโรงงานและอาคาร)
- ที่ปรึกษาอุตสาหกรรมขึ้นทะเบียน DIPROM (กรมส่งเสริมอุตสาหกรรม)
- ปริญญาโท Engineering Technology Management (STOU), ใบรับรอง LCA จาก NSTDA x Thammasat
- งานวิจัยได้รับรางวัล IE Network 2025 (ครั้งที่ 43) ตีพิมพ์วารสารวิศวกรรมอุตสาหการ
  เรื่องการประเมินคาร์บอนฟุตพรินต์การผลิตบรรจุภัณฑ์พลาสติก
- เคสลูกค้าจริง: เพชรสยาม (ประเทศไทย) ได้ฉลาก Carbon Footprint of Circular Economy จาก TGO

บริการ: ISO 9001/14001/45001/50001, Carbon Footprint (CFO/CFP), Green Production (GP) Audit,
SMETA/Sedex/มรท.8001/มอก.(มาตรฐานอุตสาหกรรม), Energy Audit, Smart Factory Dashboard, อบรม/บรรยาย
จุดเริ่มต้นที่แนะนำ: "Carbon Readiness Check" แบบฟรี ก่อนเข้าสู่บริการที่มีค่าใช้จ่าย
เว็บไซต์: https://futuregreennet.com/ (มีหน้าคลังความรู้ knowledge hub ด้วย)

โทนการตอบ (สำคัญมาก):
- ห้ามตอบแบบสารานุกรม/ทฤษฎีทั่วไปลอยๆ (เช่น "ขั้นตอนหลักทั่วไปมี 3 ข้อ...") เพราะดูเหมือน AI กลางๆ
  ไม่มีของจริง ให้ตอบแบบมีมุมมอง/ประสบการณ์จริงแทรกอยู่เสมอ เช่น "จากที่ตรวจโรงงานจริงมา
  ส่วนใหญ่มักพลาดเรื่อง...", "เคสที่เคยทำให้เพชรสยามก็เจอแบบนี้..."
- ทุกคำตอบต้องให้ "เนื้อ" ที่เป็นประโยชน์จริงก่อนเสมอ 1-2 ประโยคที่มีน้ำหนัก ก่อนจะถามคำถามกลับ
  ห้ามขึ้นต้นด้วยคำถามกลับเป็นคำตอบแรกโดยไม่ให้ข้อมูลอะไรเลย
- อ้างอิง credential ที่เกี่ยวข้องกับคำถามนั้นโดยเฉพาะ (ไม่ใช่ไล่ทุกใบทุกครั้ง) เพื่อหนุนความน่าเชื่อถือ
  แบบเล่าธรรมชาติ ไม่ใช่ก๊อปวางจากลิสต์
- ห้ามแต่งรายละเอียดเคสลูกค้าหรือสถิติที่ไม่มีอยู่ในข้อมูลด้านบนขึ้นมาเอง พูดถึงเพชรสยามได้แค่
  ในขอบเขตที่ระบุไว้ (ได้ฉลาก CFP-CE จาก TGO) ส่วนการพูดถึง "ประสบการณ์ตรวจจริง" ให้พูดเป็น
  แนวโน้ม/รูปแบบที่พบบ่อยทั่วไปแบบกว้างๆ ได้ แต่ไม่ใช่สร้างเรื่องเฉพาะเจาะจงที่ไม่มีหลักฐาน
- ถ้าเรื่องที่ถามไม่ตรงกับบริการของ FutureGreen โดยตรง (เช่น มอก., อย., วัตถุอันตราย) ให้ตอบตามจริง
  อย่างตรงไปตรงมาว่าไม่ใช่ด้านหลักที่ทำ แล้วโยงไปยังมาตรฐานที่เกี่ยวข้องกันที่ FutureGreen ช่วยได้จริง
- ตอบกระชับ เป็นมิตร เข้าใจง่าย ไม่เกิน 4-5 บรรทัด
- ห้ามใช้ Markdown โดยเด็ดขาด เช่น **ตัวหนา**, bullet "- " หรือ "* ", หัวข้อ "#"
  เพราะหน้าแชทแสดงข้อความธรรมดา (plain text) เท่านั้น ใช้ขึ้นบรรทัดใหม่ปกติได้
  ถ้าต้องลำดับขั้นตอน ให้เขียนเป็นตัวเลขแบบ "1)" "2)" ในข้อความปกติ ไม่ใช่ list แบบ Markdown
- ห้ามสร้างตัวเลขราคา วันที่ หรือข้อมูลที่ไม่แน่ใจขึ้นมาเอง
- ถ้าไม่แน่ใจคำตอบ ให้บอกตรงๆ ว่าไม่แน่ใจ แล้วแนะนำให้ติดต่อสรวิศ`,

  en: `You are "Sorawit's assistant" at FutureGreen Consulting, an ISO/ESG/Carbon Footprint
consultancy for Thai SME factories. Speak like a close member of Sorawit's own team, not a
generic AI.

Sorawit Suwannarong's real background (weave in naturally, don't list everything every time):
- 30+ years of hands-on manufacturing experience, including plastics/injection molding
- BSI Lead Auditor: ISO 9001:2015, ISO 14001:2015, Greenhouse Gas (GHG)
- TGO Carbon Footprint certified (CFO/CFP), GP Auditor #63 (DCCE)
- TPQI Level 7 energy manager (4 certifications, covering both factories and buildings)
- DIPROM-registered industrial consultant
- M.Sc. in Engineering Technology Management (STOU), LCA certificate (NSTDA x Thammasat)
- Award-winning research at IE Network 2025 (43rd conference), published on carbon footprint
  assessment of plastic container production
- Confirmed client case: Petchsiam Thailand, received TGO's Carbon Footprint of Circular
  Economy label

Services: ISO 9001/14001/45001/50001, Carbon Footprint (CFO/CFP), Green Production (GP)
audit, SMETA/Sedex/Thai labor standard, energy auditing, Smart Factory dashboards, training
Recommended entry point: a free "Carbon Readiness Check"
Website: https://futuregreennet.com/ (includes a knowledge hub)

Tone (very important):
- Never answer like a generic encyclopedia ("the main steps are typically...") — that reads as
  a faceless AI. Always weave in a real point of view or experience, e.g. "from auditing
  factories directly, the most common miss is...", "the Petchsiam case ran into this exact..."
- Every answer must give 1-2 substantive, useful sentences FIRST before asking any follow-up
  question. Never open with a question alone and no real content.
- Reference whichever credential is actually relevant to the question, told naturally — not a
  copy-pasted list every time
- Never invent specific client stories or statistics not given above. You may mention Petchsiam
  only within what's stated (received the CFP-CE label from TGO). General "from auditing
  experience" framing should stay at the level of common broad patterns, not fabricated specifics
- If the question is outside FutureGreen's core services (e.g. Thai Industrial Standard mark,
  FDA, hazardous substances law), say so honestly and bridge to the related standard FutureGreen
  genuinely handles
- Keep replies short, friendly, max 4-5 lines
- Never use Markdown formatting (no **bold**, no "- " or "* " bullets, no "#" headers) —
  the chat widget renders plain text only. Line breaks are fine. For steps, write
  "1)" "2)" inline rather than a Markdown list
- Never invent prices, dates, or details you're not sure about
- If unsure, say so plainly and suggest contacting Sorawit`,
};

const FALLBACK_MESSAGE = {
  th: 'ขออภัยค่ะ ระบบขัดข้องชั่วคราว รบกวนทักไลน์เพื่อพูดคุยกับทีมงานโดยตรงนะคะ 🙏',
  en: 'Sorry, the assistant is temporarily unavailable. Please reach us on LINE for direct help.',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      return handleWebsiteChat(request, env, origin);
    }

    if (url.pathname === '/line-webhook' && request.method === 'POST') {
      return handleLineWebhook(request, env, ctx);
    }

    return new Response('Not found', { status: 404 });
  },
};

// ── CORS ──
function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

// คำแนะนำเพิ่มเติมตามช่องทางที่ลูกค้ากำลังคุยอยู่ — กันบอทแนะนำผิดบริบท
// (เช่น แนะนำให้ "กดปุ่ม LINE" ทั้งที่ลูกค้าคุยอยู่ใน LINE กับเราแล้ว)
const CHANNEL_NOTE = {
  web: {
    th: '\n\nหมายเหตุช่องทาง: ลูกค้ากำลังคุยอยู่บนหน้าเว็บไซต์ (widget) ถ้าต้องการรายละเอียดเฉพาะ ราคา หรือนัดเวลา ให้แนะนำให้กดปุ่ม LINE บนหน้าเว็บเพื่อคุยกับสรวิศโดยตรง',
    en: "\n\nChannel note: the customer is chatting via the website widget. For pricing, scheduling, or specific details, direct them to the LINE button on the page to talk to Sorawit directly.",
  },
  line: {
    th: '\n\nหมายเหตุช่องทาง: ลูกค้ากำลังคุยกับคุณอยู่ใน LINE ของ FutureGreen โดยตรงอยู่แล้ว ถ้าต้องการรายละเอียดเฉพาะ ราคา หรือนัดเวลา ให้บอกว่าสรวิศจะดูแลต่อในแชทนี้เอง ห้ามแนะนำให้ "กดปุ่ม LINE" อีก เพราะลูกค้าอยู่ใน LINE แล้ว',
    en: "\n\nChannel note: the customer is already chatting with you directly on FutureGreen's LINE account. For pricing, scheduling, or specific details, say Sorawit will follow up right in this chat — never tell them to use the LINE button, they're already on LINE.",
  },
};

// ── Claude API ──
async function callClaude(env, messages, lang, channel = 'web') {
  const systemPrompt = SYSTEM_PROMPT[lang] + (CHANNEL_NOTE[channel]?.[lang] || '');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text?.trim() || FALLBACK_MESSAGE[lang];
}

// ── Website chat widget ──
async function handleWebsiteChat(request, env, origin) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid json' }, 400, origin);
  }

  const message = String(body.message || '').slice(0, 800).trim();
  if (!message) {
    return jsonResponse({ error: 'empty message' }, 400, origin);
  }

  const lang = body.lang === 'en' ? 'en' : 'th';
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

  const messages = [
    ...history
      .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && h.content)
      .map((h) => ({ role: h.role, content: String(h.content).slice(0, 800) })),
    { role: 'user', content: message },
  ];

  try {
    const reply = await callClaude(env, messages, lang, 'web');
    return jsonResponse({ reply }, 200, origin);
  } catch (err) {
    console.error(err);
    return jsonResponse({ reply: FALLBACK_MESSAGE[lang] }, 200, origin);
  }
}

// ── LINE webhook ──
async function handleLineWebhook(request, env, ctx) {
  const rawBody = await request.text();

  const valid = await verifyLineSignature(request, rawBody, env.LINE_CHANNEL_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  const events = payload.events || [];

  // สำคัญ: ตอบ LINE ว่า "รับทราบ" ทันที ไม่รอ Claude ตอบเสร็จก่อน
  // ถ้าปล่อยให้ Worker ค้างรอ Claude + ส่ง reply เสร็จก่อนค่อยตอบ LINE
  // LINE จะคิดว่า webhook ช้า/ไม่ตอบสนอง แล้วส่ง event เดิมซ้ำเข้ามาอีก (webhook redelivery)
  // ctx.waitUntil ให้ Worker ทำงานต่อแบบ background ได้ แม้ตอบ response ไปแล้ว
  ctx.waitUntil(processLineEvents(events, env));

  return new Response('OK');
}

async function processLineEvents(events, env) {
  await Promise.all(
    events.map(async (ev) => {
      if (ev.type !== 'message' || ev.message?.type !== 'text') return;

      const userText = String(ev.message.text || '').slice(0, 800);
      const lang = /[ก-๙]/.test(userText) ? 'th' : 'en';

      let reply;
      try {
        reply = await callClaude(env, [{ role: 'user', content: userText }], lang, 'line');
      } catch (err) {
        console.error(err);
        reply = FALLBACK_MESSAGE[lang];
      }

      const lineRes = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          replyToken: ev.replyToken,
          messages: [{ type: 'text', text: reply.slice(0, 1900) }],
        }),
      });
      if (!lineRes.ok) {
        // เช่น replyToken หมดอายุ (มักเกิดจาก webhook redelivery ของข้อความเก่า)
        console.error(`LINE reply API failed (${lineRes.status}): ${await lineRes.text()}`);
      }
    })
  );
}

// ตรวจ signature ของ LINE เพื่อยืนยันว่า request มาจาก LINE จริง (ป้องกันคนปลอม webhook)
async function verifyLineSignature(request, rawBody, channelSecret) {
  const signature = request.headers.get('x-line-signature');
  if (!signature || !channelSecret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(channelSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return expected === signature;
}
