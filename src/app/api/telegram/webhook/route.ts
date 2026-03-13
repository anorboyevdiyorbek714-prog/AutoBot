import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TelegramWebhookBody {
  message?: {
    chat: {
      id: number;
    };
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

    // 1. Fetch knowledge base from Supabase
    const { data: bot, error: botError } = await supabaseAdmin
      .from("bots")
      .select("knowledge_base")
      .eq("bot_token", botToken)
      .single();

    if (botError || !bot) {
      console.error("Bot not found for token:", botToken, botError);
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    // 2. Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Use this knowledge base to answer the user: ${bot.knowledge_base}`,
        },
        { role: "user", content: userText },
      ],
    });

    const aiResponse = completion.choices[0].message.content;

    // 3. Send message back to Telegram
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponse,
      }),
    });

    if (!telegramRes.ok) {
      const errorData = await telegramRes.json();
      console.error("Telegram API error:", errorData);
    }

    // 4. Log to messages table
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
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
