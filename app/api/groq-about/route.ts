// app/api/groq-about/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description || description.length < 10) {
      return NextResponse.json({ error: "Description too short" }, { status: 400 });
    }

    if (!process.env.GROQ_FORM_API_KEY) {
      console.error("[groq-about] GROQ_FORM_API_KEY not configured");
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    // Add timeout for Groq API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_FORM_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: "You are a tool summary generator. Expand the given short description into a more detailed paragraph (about 2–4 sentences) for the 'About' section of a SaaS tool website.",
            },
            {
              role: "user",
              content: description,
            },
          ],
          temperature: 0.7,
          max_tokens: 200,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqRes.ok) {
        const errorData = await groqRes.text();
        console.error(`[groq-about] Groq API error ${groqRes.status}:`, errorData);
        return NextResponse.json({ 
          error: `Groq API error: ${groqRes.status} ${groqRes.statusText}` 
        }, { status: 500 });
      }

      const data = await groqRes.json();
      const aboutText = data.choices?.[0]?.message?.content?.trim();

      if (!aboutText) {
        console.error("[groq-about] No content in Groq response:", data);
        return NextResponse.json({ error: "Failed to generate about text" }, { status: 500 });
      }

      console.log(`[groq-about] Successfully generated about text for: ${description.substring(0, 50)}...`);
      return NextResponse.json({ about: aboutText });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[groq-about] Timeout for Groq API call");
        return NextResponse.json({ 
          error: "Groq API timeout - request took too long" 
        }, { status: 408 });
      }
      
      console.error("[groq-about] Groq API fetch error:", fetchError);
      return NextResponse.json({ 
        error: `Groq API error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error("[groq-about] Error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
} 