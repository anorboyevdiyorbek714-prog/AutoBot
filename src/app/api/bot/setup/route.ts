import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { botToken } = await req.json();

    if (!botToken || !botToken.includes(":")) {
      return NextResponse.json({ error: "Yaroqsiz bot token" }, { status: 400 });
    }

    // 1. Bazaga tokenni saqlash (upsert)
    const { data, error } = await supabase
      .from("bots")
      .upsert(
        { bot_token: botToken },
        { onConflict: 'bot_token' }
      )
      .select()
      .single();

    if (error) throw error;

    // 2. Telegram Webhook ulanishi (backenddan)
    const origin = req.headers.get("origin") || "https://autobot.ai";
    const webhookUrl = `${origin}/api/telegram/webhook?bot_token=${botToken}`;
    
    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const tgData = await tgResponse.json();

    if (!tgData.ok) {
      throw new Error(`Telegram xatosi: ${tgData.description}`);
    }

    return NextResponse.json({ success: true, botId: data.id });
  } catch (err: any) {
    console.error("Bot setup error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
