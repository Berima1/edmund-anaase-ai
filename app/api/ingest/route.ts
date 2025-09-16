import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { HfInference } from "@huggingface/inference";
import pdf from "pdf-parse";
import axios from "axios";
import * as cheerio from "cheerio";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
const hf = new HfInference(process.env.HF_TOKEN);

async function embedText(text: string) {
  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text
  });
  return embedding;
}

export async function GET() {
  try {
    // Example: Scrape African Union treaties page
    const res = await axios.get("https://au.int/en/treaties");
    const $ = cheerio.load(res.data);

    const docs: any[] = [];
    $("a").each((_, el) => {
      const title = $(el).text().trim();
      const url = $(el).attr("href");
      if (url?.endsWith(".pdf")) {
        docs.push({ title, url });
      }
    });

    const results: any[] = [];
    for (const doc of docs.slice(0, 3)) { // limit for demo
      const file = await axios.get(doc.url, { responseType: "arraybuffer" });
      const pdfText = await pdf(Buffer.from(file.data));

      const embedding = await embedText(pdfText.text.slice(0, 1000));

      await supabase.from("documents").insert({
        title: doc.title,
        content: pdfText.text,
        metadata: { source: "African Union", url: doc.url },
        embedding
      });

      results.push(doc.title);
    }

    return NextResponse.json({ message: "Docs ingested", count: results.length, results });
  } catch (err) {
    console.error("Ingest error:", err);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
    }
