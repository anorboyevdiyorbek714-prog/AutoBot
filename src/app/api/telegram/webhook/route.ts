import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// XAVFSIZLIK: Kalit endi .env faylidan olinadi
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TelegramWebhookBody {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botToken = searchParams.get("bot_token") || req.headers.get("x-telegram-bot-token");

    if (!botToken) {
      return NextResponse.json({ error: "No bot token provided" }, { status: 400 });
    }

    const body = (await req.json()) as TelegramWebhookBody;
    const { message } = body;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // 1. Bazadan aynan qaysi botga yozishganini topish
    const { data: bot, error: botError } = await supabaseAdmin
      .from("bots")
      .select("id, knowledge_base")
      .eq("bot_token", botToken)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // 2. Foydalanuvchi yozgan savolni Vektorga aylantirish (RAG tizimi uchun)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: userText,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 3. Vektor bazadan savolga eng mos javoblarni (bo'laklarni) qidirish
    const { data: matchedChunks, error: matchError } = await supabaseAdmin.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.3, // O'xshashlik darajasi
        match_count: 5, // Eng mos 5 ta bo'lakni olib keladi
        p_bot_id: bot.id,
      }
    );

    // AI ga beriladigan umumiy ma'lumotni tayyorlash (Eski text + Yangi PDF/Fayl qismlari)
    let aiContext = `Boshlang'ich ma'lumot: ${bot.knowledge_base || ""}\n\n`;
    if (matchedChunks && matchedChunks.length > 0) {
      aiContext += "Qo'shimcha hujjatlardan topilgan ma'lumotlar:\n";
      matchedChunks.forEach((chunk: any) => {
        aiContext += `- ${chunk.content}\n`;
      });
    }

    // 4. OpenAI orqali aqlli javob shakllantirish
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Sen yordamchi agentsan. Faqat quyidagi ma'lumotlarga asoslanib foydalanuvchiga javob ber. Agar javob ma'lumotlar ichida bo'lmasa, 'Bu haqda ma'lumotga ega emasman' deb javob ber.\n\nMa'lumotlar:\n${aiContext}`,
        },
        { role: "user", content: userText },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // 5. Telegramga javobni yuborish
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponse,
      }),
    });

    // 6. Tarixni saqlab qo'yish
    await supabaseAdmin.from("messages").insert([
      {
        chat_id: chatId.toString(),
        bot_token: botToken,
        user_message: userText,
        ai_response: aiResponse,
      },
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook xatosi:", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}