import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "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",
});

/**
 * Splits text into chunks of approx `chunkSize` characters with `overlap`.
 */
export function splitText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Generates vector embedding for a given text using text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (err) {
    console.error("Embedding error:", err);
    throw new Error("Failed to generate embedding");
  }
}
