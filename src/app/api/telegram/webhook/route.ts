import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botToken = searchParams.get("bot_token");

    if (!botToken) {
      return NextResponse.json({ error: "No bot token provided" }, { status: 400 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // 1. Yangi foydalanuvchilar botga kirganda START bosgani uchun:
    if (userText === '/start') {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Assalomu alaykum! Men aqlli AI yordamchiman. O'z savollaringizni berishingiz mumkin.",
        }),
      });
      return NextResponse.json({ ok: true });
    }

    const { data: bot } = await supabaseAdmin
      .from("bots")
      .select("id")
      .eq("bot_token", botToken)
      .single();

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // 2. Foydalanuvchi so'rovini Vektorga aylantiramiz
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userText,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 3. Bazadan fayllar/matnlarni qidirish (RAG)
    const { data: matchedChunks } = await supabaseAdmin.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 5,
      p_bot_id: bot.id,
    });

    let aiContext = "";
    if (matchedChunks && matchedChunks.length > 0) {
      aiContext += "Baza ma'lumotlari:\n";
      matchedChunks.forEach((chunk: any) => {
        aiContext += `- ${chunk.content}\n`;
      });
    } else {
      aiContext = "Kechirasiz, menda bu borada aniq ma'lumot yo'q. Iltimos operatorga bog'laning.";
    }

    // 4. OpenAI'dan chiroyli javob generatsiya qilish
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Sen aqlli yordamchisan. Faqat quyidagi ma'lumotlarga qarab qisqa, tushunarli va insoniy tilda javob ber. Agar javob ma'lumotlarda yo'q bo'lsa, uni o'zingdan o'ylab topma.\n\nMa'lumotlar:\n${aiContext}`,
        },
        { role: "user", content: userText },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // 5. Telegramga xabarni qaytarish
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponse,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook xatosi:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}