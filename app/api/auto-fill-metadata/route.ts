// app/api/auto-fill-metadata/route.ts
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Helper to extract only the tool name from a full title string
function extractToolName(title: string): string {
  if (!title) return '';
  // Common separators: |, -, :, ·, —, •
  const separators = ['|', '-', ':', '·', '—', '•'];
  let best = title;
  separators.forEach(sep => {
    if (best.includes(sep)) {
      // Take the first part before the separator if it's not too short
      const parts = best.split(sep).map(p => p.trim());
      if (parts[0].length >= 3 && parts[0].length <= 40) {
        best = parts[0];
      }
    }
  });
  // Remove common marketing suffixes
  best = best.replace(/(Free|Official|AI|for .+|Online|App|Website|Platform|Tool|by .+)$/i, '').trim();
  // Remove trailing punctuation
  best = best.replace(/[\s\-:|·—•]+$/, '').trim();
  // Remove extra spaces
  best = best.replace(/\s{2,}/g, ' ');
  return best;
}

export async function POST(req: Request) {
  try {
    const { websiteUrl } = await req.json();

    if (!websiteUrl || !/^https?:\/\//.test(websiteUrl)) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    // Add timeout and better headers for the fetch request
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
        console.error(`[auto-fill-metadata] HTTP ${res.status} for ${websiteUrl}`);
        
        // Handle specific error cases
        if (res.status === 403) {
          return NextResponse.json({ 
            error: 'Website blocked access (403 Forbidden). Try entering metadata manually.',
            suggestion: 'Some websites block automated requests. You can still add the tool manually.'
          }, { status: 403 });
        }
        
        if (res.status === 404) {
          return NextResponse.json({ 
            error: 'Website not found (404). Please check the URL.',
            suggestion: 'Make sure the website URL is correct and accessible.'
          }, { status: 404 });
        }
        
        return NextResponse.json({ 
          error: `Failed to fetch URL: ${res.status} ${res.statusText}`,
          suggestion: 'Try entering the tool information manually.'
        }, { status: 500 });
      }

      const html = await res.text();
      
      if (!html || html.length < 100) {
        console.warn(`[auto-fill-metadata] Received very short HTML for ${websiteUrl}`);
        return NextResponse.json({
          title: '',
          logoUrl: '',
        });
      }

      const $ = cheerio.load(html);

      let title =
        $('meta[property="og:title"]').attr('content')?.trim() ||
        $('title').text().trim() ||
        '';

      // Clean and extract just the tool name from the title
      title = extractToolName(title);

      // We no longer extract description - only title and logo

      // Improved logo detection - prioritize actual logos over large images
      let logoUrl = '';
      
      // First, try to find specific logo meta tags
      const logoMeta = $('meta[property="og:logo"], meta[name="logo"], meta[property="logo"]').attr('content')?.trim();
      if (logoMeta) {
        logoUrl = logoMeta;
      }
      
      // If no specific logo, try to find logo images in the HTML
      if (!logoUrl) {
        const logoImg = $('img[src*="logo"], img[alt*="logo"], img[class*="logo"], img[id*="logo"]').first();
        if (logoImg.length > 0) {
          logoUrl = logoImg.attr('src')?.trim() || '';
        }
      }
      
      // If still no logo, try favicon (small icon)
      if (!logoUrl) {
        logoUrl = $('link[rel="icon"]').attr('href')?.trim() ||
                  $('link[rel="shortcut icon"]').attr('href')?.trim() ||
                  $('link[rel="apple-touch-icon"]').attr('href')?.trim() ||
                  '';
      }
      
      // Last resort: use og:image but only if it's not too large (likely a banner)
      if (!logoUrl) {
        const ogImage = $('meta[property="og:image"]').attr('content')?.trim();
        if (ogImage) {
          // Check if the image URL suggests it's a logo (smaller dimensions or logo-related filename)
          const isLikelyLogo = ogImage.includes('logo') || 
                              ogImage.includes('icon') || 
                              ogImage.includes('favicon') ||
                              ogImage.includes('brand') ||
                              ogImage.includes('small') ||
                              ogImage.includes('32') ||
                              ogImage.includes('64') ||
                              ogImage.includes('128');
          
          if (isLikelyLogo) {
            logoUrl = ogImage;
          }
        }
      }

      // Handle relative URLs
      if (logoUrl && !logoUrl.startsWith('http')) {
        try {
          logoUrl = new URL(logoUrl, websiteUrl).href;
        } catch (urlError) {
          console.warn(`[auto-fill-metadata] Failed to resolve logo URL: ${logoUrl}`, urlError);
          logoUrl = '';
        }
      }

      console.log(`[auto-fill-metadata] Success for ${websiteUrl}:`, { 
        title, 
        logoUrl,
        logoSource: logoUrl ? 'detected' : 'none found'
      });

      return NextResponse.json({
        title,
        logoUrl,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[auto-fill-metadata] Timeout for ${websiteUrl}`);
        return NextResponse.json({ 
          error: 'Request timeout - website took too long to respond' 
        }, { status: 408 });
      }
      
      console.error(`[auto-fill-metadata] Fetch error for ${websiteUrl}:`, fetchError);
      return NextResponse.json({ 
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (err) {
    console.error('[auto-fill-metadata] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}
