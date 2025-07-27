// app/api/extract-keywords/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_FORM_API_KEY;

// interface KeywordsResponse {
//   keywords: string[];
//   error?: string;
// }

export async function POST(req: Request) {
  try {
    const { websiteUrl } = await req.json();

    if (!websiteUrl || !/^https?:\/\//.test(websiteUrl)) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      console.error("[extract-keywords] GROQ_API_KEY not configured");
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 });
    }

    // Fetch website content
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const res = await fetch(websiteUrl, { 
        method: 'GET', 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`[extract-keywords] HTTP ${res.status} for ${websiteUrl}`);
        return NextResponse.json({ 
          error: `Failed to fetch URL: ${res.status} ${res.statusText}`,
        }, { status: 500 });
      }

      const html = await res.text();
      
      if (!html || html.length < 100) {
        console.warn(`[extract-keywords] Received very short HTML for ${websiteUrl}`);
        return NextResponse.json({
          keywords: [],
          error: 'Website content too short to extract keywords'
        });
      }

      const $ = cheerio.load(html);

      // Extract relevant content for keyword analysis
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
      const ogDescription = $('meta[property="og:description"]').attr('content')?.trim() || '';
      const h1Text = $('h1').first().text().trim();
      const h2Texts = $('h2').slice(0, 3).map((_, el) => $(el).text().trim()).get().join(' ');
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1000);

      const contentForAnalysis = `
Title: ${title}
Meta Description: ${metaDescription}
OG Description: ${ogDescription}
H1: ${h1Text}
H2s: ${h2Texts}
Body Text: ${bodyText}
      `.trim();

      // Use AI to extract keywords
      const groqResponse = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are a keyword extractor for AI tools. Extract 5-10 relevant keywords from the website content that users might search for when looking for this AI tool.
              
              EXAMPLES:
              - For a resume builder: ["ai", "resume builder", "cv generator", "professional resumes", "career tools", "job applications", "ats friendly", "template"]
              - For a coding assistant: ["ai", "code assistant", "programming", "developer tools", "code completion", "debugging", "syntax highlighting"]
              - For an image generator: ["ai", "image generation", "art creation", "visual design", "graphics", "illustration", "creative tools"]
              
              RULES:
              - Extract exactly 5-10 keywords
              - Include "ai" as the first keyword if it's an AI tool
              - Focus on what users would search for
              - Use common, searchable terms
              - Avoid overly specific technical terms
              - Return only the keywords array, no other text
              - Each keyword should be 1-3 words maximum
              `,
            },
            {
              role: 'user',
              content: contentForAnalysis,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.text();
        console.error(`[extract-keywords] Groq API error ${groqResponse.status}:`, errorData);
        return NextResponse.json({ 
          error: `Groq API error: ${groqResponse.status} ${groqResponse.statusText}` 
        }, { status: 500 });
      }

      const data = await groqResponse.json();
      const responseText = data.choices?.[0]?.message?.content?.trim();

      if (!responseText) {
        console.error("[extract-keywords] No content in Groq response:", data);
        return NextResponse.json({ error: "Failed to extract keywords" }, { status: 500 });
      }

      // Parse the response to extract keywords
      let keywords: string[] = [];
      try {
        // Try to parse as JSON first
        if (responseText.startsWith('[') && responseText.endsWith(']')) {
          keywords = JSON.parse(responseText);
        } else {
          // Try to extract keywords from text response
          const keywordMatch = responseText.match(/\[(.*)\]/);
          if (keywordMatch) {
            keywords = keywordMatch[1].split(',').map((k: string) => k.trim().replace(/"/g, ''));
          } else {
            // Fallback: split by common delimiters
            keywords = responseText.split(/[,;]/).map((k: string) => k.trim()).filter((k: string) => k.length > 0);
          }
        }
      } catch (parseError) {
        console.error("[extract-keywords] Failed to parse keywords:", parseError);
        // Fallback: extract individual words
        keywords = responseText.split(/\s+/).filter((word: string) => word.length > 2).slice(0, 10);
      }

      // Clean and validate keywords
      keywords = keywords
        .map((k: string) => k.toLowerCase().trim())
        .filter((k: string) => k.length > 0 && k.length <= 20)
        .slice(0, 10);

      // Ensure we have at least 5 keywords
      if (keywords.length < 5) {
        // Add some default keywords based on common AI tool patterns
        const defaultKeywords = ['ai', 'tool', 'automation', 'productivity', 'software'];
        keywords = [...keywords, ...defaultKeywords.slice(0, 5 - keywords.length)];
      }

      console.log(`[extract-keywords] Successfully extracted keywords for ${websiteUrl}:`, keywords);
      return NextResponse.json({ keywords });

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[extract-keywords] Timeout for ${websiteUrl}`);
        return NextResponse.json({ 
          error: 'Request timeout - website took too long to respond' 
        }, { status: 408 });
      }
      
      console.error(`[extract-keywords] Fetch error for ${websiteUrl}:`, fetchError);
      return NextResponse.json({ 
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (err) {
    console.error('[extract-keywords] Error:', err);
    return NextResponse.json({ error: 'Failed to extract keywords' }, { status: 500 });
  }
} 