export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { splitText, generateEmbedding } from "@/lib/rag";
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const pdf = require("pdf-parse");
    const formData = await req.formData();
    const botId = formData.get("botId") as string;
    const text = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

    if (!botId) {
      return NextResponse.json({ error: "botId is required" }, { status: 400 });
    }

    let extractedText = "";
    let fileName = "Raw Text";
    let fileType = "txt";

    if (file) {
      fileName = file.name;
      fileType = fileName.split(".").pop() || "txt";
      const buffer = Buffer.from(await file.arrayBuffer());

      if (fileType === "pdf") {
        const data = await pdf(buffer);
        extractedText = data.text;
      } else if (fileType === "docx") {
        const data = await mammoth.extractRawText({ buffer });
        extractedText = data.value;
      } else {
        extractedText = buffer.toString("utf-8");
      }
    } else if (text) {
      extractedText = text;
    } else {
      return NextResponse.json({ error: "Knowledge content is empty" }, { status: 400 });
    }

    // 1. Save Document Reference
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        bot_id: botId,
        name: fileName,
        type: fileType,
      })
      .select()
      .single();

    if (docError) throw docError;

    // 2. Chunking
    const chunks = splitText(extractedText);

    // 3. Embedding and Ingestion
    const chunkPromises = chunks.map(async (content, index) => {
      const embedding = await generateEmbedding(content);
      return {
        document_id: document.id,
        content,
        embedding,
        metadata: { index, fileName },
      };
    });

    const processedChunks = await Promise.all(chunkPromises);

    const { error: chunkError } = await supabase
      .from("document_chunks")
      .insert(processedChunks);

    if (chunkError) throw chunkError;

    return NextResponse.json(document);
  } catch (err: any) {
    console.error("Knowledge ingestion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
