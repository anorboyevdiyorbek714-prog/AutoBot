export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { splitText, generateEmbedding } from "@/lib/rag";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const botId = formData.get("botId") as string;
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;

    let extractedText = "";
    let title = "Matnli ma'lumot";

    if (file) {
      title = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      
      if (file.type === "application/pdf") {
        const pdf = require("pdf-parse"); // Faqat kerak payti chaqiriladi
        const pdfData = await pdf(buffer);
        extractedText = pdfData.text;
      } else if (file.name.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else if (file.type === "text/plain") {
        extractedText = buffer.toString("utf-8");
      }
    } else if (text) {
      extractedText = text;
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Matn yoki fayl bo'sh" }, { status: 400 });
    }

    // Bazaga aslnusxani saqlaymiz
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert([{ bot_id: botId, title, content: extractedText }])
      .select()
      .single();

    if (docError) throw docError;

    // Matnni parchalaymiz
    const chunks = splitText(extractedText);

    // Parchalarni vektorlashtirib bazaga saqlaymiz
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      await supabase.from("document_chunks").insert([{
        document_id: document.id,
        bot_id: botId,
        content: chunk,
        embedding,
      }]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Knowledge add error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}