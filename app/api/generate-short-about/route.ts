// app/api/generate-short-about/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, description, keywords } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!process.env.GROQ_FORM_API_KEY) {
      console.error("[generate-short-about] GROQ_FORM_API_KEY not configured");
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
              content: `You are a tool description generator. Create a short, compelling about text (exactly 25 words) for an AI tool that highlights its unique value proposition (USP).

              RULES:
              - Exactly 25 words maximum
              - Focus on the main benefit and USP
              - Be compelling and action-oriented
              - Use simple, clear language
              - Avoid technical jargon
              - Include what makes it unique
              - End with a benefit or outcome
              
              EXAMPLES:
              - "AI-powered resume builder that creates ATS-friendly resumes in minutes. Stand out to employers with professional templates and smart suggestions."
              - "Advanced code assistant that understands context and provides intelligent suggestions. Boost productivity with real-time error detection and refactoring."
              - "Creative AI image generator that turns ideas into stunning visuals. Create professional graphics, illustrations, and designs in seconds."
              
              Return only the about text, no other content.`,
            },
            {
              role: "user",
              content: `Tool: ${title}
Description: ${description || 'AI tool'}
Keywords: ${keywords ? keywords.join(', ') : 'N/A'}

Generate a 25-word about text:`,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqRes.ok) {
        const errorData = await groqRes.text();
        console.error(`[generate-short-about] Groq API error ${groqRes.status}:`, errorData);
        return NextResponse.json({ 
          error: `Groq API error: ${groqRes.status} ${groqRes.statusText}` 
        }, { status: 500 });
      }

      const data = await groqRes.json();
      const aboutText = data.choices?.[0]?.message?.content?.trim();

      if (!aboutText) {
        console.error("[generate-short-about] No content in Groq response:", data);
        return NextResponse.json({ error: "Failed to generate about text" }, { status: 500 });
      }

      // Clean the response and ensure it's around 25 words
      const cleanedText = aboutText
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      const wordCount = cleanedText.split(/\s+/).length;
      
      console.log(`[generate-short-about] Successfully generated about text (${wordCount} words) for: ${title}`);
      return NextResponse.json({ about: cleanedText, wordCount });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[generate-short-about] Timeout for Groq API call");
        return NextResponse.json({ 
          error: "Groq API timeout - request took too long" 
        }, { status: 408 });
      }
      
      console.error("[generate-short-about] Groq API fetch error:", fetchError);
      return NextResponse.json({ 
        error: `Groq API error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (err: unknown) {
    console.error("[generate-short-about] Error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
} 