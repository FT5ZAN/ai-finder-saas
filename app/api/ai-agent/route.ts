import { NextRequest, NextResponse } from 'next/server';
import { connectToolsDB } from '@/lib/db/websitedb';
import { getToolModel } from '@/models/tools';
import { applyRateLimit, getRateLimiter } from '@/lib/rateLimiter';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_CHATBOT_API_KEY = process.env.GROQ_CHATBOT_API_KEY;

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

interface AIRequestBody {
  message: string;
}

interface ToolResult {
  id: string;
  title: string;
  logoUrl: string;
  websiteUrl: string;
  likeCount: number;
  saveCount: number;
  toolType?: 'browser' | 'downloadable';
  about?: string;
  category?: string;
  keywords?: string[];
}

interface AIResponse {
  answer: string;
  tools: ToolResult[];
  moreLink: string;
  isExactMatch?: boolean;
  toolNotFound?: boolean;
  complaintMessage?: string;
  missingTool?: string;
  missingCategory?: string;
}

function validateMessage(message: string): boolean {
  return Boolean(message && 
         typeof message === 'string' && 
         message.trim().length > 0 && 
         message.trim().length <= 1000);
}

// Content filter to detect inappropriate queries
function isInappropriateQuery(userMessage: string): { isInappropriate: boolean; reason: string } {
  const lowerMessage = userMessage.toLowerCase();
  
  // Define inappropriate patterns
  const inappropriatePatterns = [
    // Illegal activities
    { pattern: /\b(hack|hacking|hacked)\b.*\b(bank|financial|money|account|password|credit card)\b/i, reason: "illegal financial activities" },
    { pattern: /\b(cheat|cheating|cheated)\b.*\b(exam|test|assignment|homework|academic)\b/i, reason: "academic dishonesty" },
    { pattern: /\b(steal|stealing|stolen)\b/i, reason: "theft" },
    { pattern: /\b(illegal|unlawful|criminal)\b/i, reason: "illegal activities" },
    { pattern: /\b(fraud|scam|phishing)\b/i, reason: "fraudulent activities" },
    { pattern: /\b(cyber.?attack|ddos|malware|virus|trojan)\b/i, reason: "cyber attacks" },
    { pattern: /\b(spam|spamming)\b/i, reason: "spam activities" },
    { pattern: /\b(plagiarism|plagiarize|copy.?paste)\b/i, reason: "plagiarism" },
    
    // Harmful content
    { pattern: /\b(harm|hurt|kill|violence|weapon)\b/i, reason: "harmful content" },
    { pattern: /\b(drugs|illegal.?substances)\b/i, reason: "illegal substances" },
    
    // Privacy violations
    { pattern: /\b(spy|spying|surveillance|tracking)\b.*\b(without|consent|permission)\b/i, reason: "privacy violations" },
    { pattern: /\b(stalk|stalking)\b/i, reason: "stalking" },
    
    // Explicit content
    { pattern: /\b(porn|pornography|adult.?content|explicit)\b/i, reason: "explicit content" }
  ];
  
  // Check for inappropriate patterns
  for (const { pattern, reason } of inappropriatePatterns) {
    if (pattern.test(lowerMessage)) {
      return { isInappropriate: true, reason };
    }
  }
  
  return { isInappropriate: false, reason: "" };
}

// Extract search intent and keywords from user message using AI
async function extractSearchIntent(userMessage: string): Promise<{ intent: string; keywords: string[]; isSpecificTool: boolean }> {
  if (!GROQ_CHATBOT_API_KEY) {
    // Fallback logic for when GROQ is not available
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for category queries
    if (lowerMessage.includes('all in one') || lowerMessage.includes('all-in-one')) {
      return {
        intent: 'category_search',
        keywords: ['all', 'in', 'one'],
        isSpecificTool: false
      };
    }
    
    // Check for specific tool queries
    const specificToolPatterns = [
      /tell me about (.+)/i,
      /what is (.+)/i,
      /show me (.+)/i,
      /i want (.+)/i,
      /find (.+)/i
    ];
    
    for (const pattern of specificToolPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const toolName = match[1].trim();
        return {
          intent: 'specific_tool',
          keywords: [toolName],
          isSpecificTool: true
        };
      }
    }
    
    // Check for image generator related queries
    if (lowerMessage.includes('image') && (lowerMessage.includes('generator') || lowerMessage.includes('generation'))) {
      return {
        intent: 'general_search',
        keywords: ['image', 'generator', 'art', 'creative'],
        isSpecificTool: false
      };
    }
    
    // Default to general search
    return {
      intent: 'general_search',
      keywords: userMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2),
      isSpecificTool: false
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_CHATBOT_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `Extract search intent from user message. Respond with JSON only: {"intent": "specific_tool|category_search|general_search", "keywords": ["keyword1", "keyword2"], "isSpecificTool": true/false}

PATTERNS:
- "tell me about X" → specific_tool, keywords: [X]
- "what is X" → specific_tool, keywords: [X] 
- "ALL IN ONE" → category_search, keywords: ["all", "in", "one"]
- "tools for X" → general_search, keywords: [X]
- "image generator" → general_search, keywords: ["image", "generator"]

Keep keywords specific and meaningful.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    });

    clearTimeout(timeoutId);

    if (!groqResponse.ok) {
      throw new Error(`GROQ API error: ${groqResponse.status}`);
    }

    const data: GroqResponse = await groqResponse.json();
    
    if (data.error) {
      throw new Error(`GROQ API error: ${data.error.message}`);
    }

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from GROQ API');
    }

    // Parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent || 'general_search',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        isSpecificTool: Boolean(parsed.isSpecificTool)
      };
    } catch {
      console.error('Failed to parse GROQ response:', content);
      throw new Error('Invalid JSON response from GROQ API');
    }

  } catch (error) {
    console.error('Error extracting search intent:', error);
    
    // Fallback to basic keyword extraction
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for category queries
    if (lowerMessage.includes('all in one') || lowerMessage.includes('all-in-one')) {
      return {
        intent: 'category_search',
        keywords: ['all', 'in', 'one'],
        isSpecificTool: false
      };
    }
    
    // Check for specific tool queries
    const specificToolPatterns = [
      /tell me about (.+)/i,
      /what is (.+)/i,
      /show me (.+)/i,
      /i want (.+)/i,
      /find (.+)/i
    ];
    
    for (const pattern of specificToolPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const toolName = match[1].trim();
        return {
          intent: 'specific_tool',
          keywords: [toolName],
          isSpecificTool: true
        };
      }
    }
    
    // Default to general search
    return {
      intent: 'general_search',
      keywords: userMessage.toLowerCase().split(/\s+/).filter(word => word.length > 2),
      isSpecificTool: false
    };
  }
}

// Search tools in database using intelligent matching
async function searchTools(keywords: string[], isSpecificTool: boolean): Promise<ToolResult[]> {
  try {
    await connectToolsDB();
    const Tool = await getToolModel();

    // Case 1: Specific tool name queries
    if (isSpecificTool) {
      // First, find the exact tool
      const searchPatterns = [];
      
      // Add exact matches first (highest priority)
      for (const keyword of keywords) {
        searchPatterns.push(
          { title: { $regex: `^${keyword}$`, $options: 'i' } }, // Exact title match
          { title: { $regex: `\\b${keyword}\\b`, $options: 'i' } }, // Word boundary match
          { title: { $regex: keyword.replace(/\s+/g, ''), $options: 'i' } }, // No spaces version
          { title: { $regex: keyword, $options: 'i' } } // Contains match
        );
      }

      const exactTools = await Tool.aggregate([
        {
          $match: {
            $or: searchPatterns,
            isActive: true
          }
        },
        {
          $addFields: {
            // Calculate exact match score
            exactMatchScore: {
              $add: [
                // Perfect title match gets highest score
                { $cond: [{ $regexMatch: { input: '$title', regex: `^${keywords.join('|')}$`, options: 'i' } }, 100, 0] },
                // Word boundary match
                { $cond: [{ $regexMatch: { input: '$title', regex: `\\b${keywords.join('|')}\\b`, options: 'i' } }, 80, 0] },
                // No spaces version match
                { $cond: [{ $regexMatch: { input: '$title', regex: keywords.map(k => k.replace(/\s+/g, '')).join('|'), options: 'i' } }, 70, 0] },
                // Contains match
                { $cond: [{ $regexMatch: { input: '$title', regex: keywords.join('|'), options: 'i' } }, 50, 0] },
                // Popularity bonus
                { $add: ['$likeCount', '$saveCount'] }
              ]
            }
          }
        },
        {
          $sort: { exactMatchScore: -1 }
        },
        {
          $limit: 1
        }
      ]);

      // If we found the exact tool, get its category and find top 5 tools from same category
      if (exactTools.length > 0) {
        const exactTool = exactTools[0];
        const category = exactTool.category;
        
        if (category) {
          // Find top 5 tools from the same category, sorted by popularity
          const categoryTools = await Tool.aggregate([
            {
              $match: {
                category: { $regex: new RegExp(category, 'i') },
                _id: { $ne: exactTool._id }, // Exclude the exact tool
                isActive: true
              }
            },
            {
              $addFields: {
                popularityScore: {
                  $add: ['$likeCount', '$saveCount']
                }
              }
            },
            {
              $sort: { popularityScore: -1 }
            },
            {
              $limit: 4 // Get 4 more to make total of 5
            }
          ]);

          // Combine exact tool with category tools
          const allTools = [
            {
              id: exactTool._id?.toString() || '',
              title: exactTool.title,
              logoUrl: exactTool.logoUrl,
              websiteUrl: exactTool.websiteUrl,
              likeCount: exactTool.likeCount || 0,
              saveCount: exactTool.saveCount || 0,
              toolType: exactTool.toolType || 'browser',
              about: exactTool.about,
              category: exactTool.category,
              keywords: exactTool.keywords || []
            },
            ...categoryTools.map(tool => ({
              id: tool._id?.toString() || '',
              title: tool.title,
              logoUrl: tool.logoUrl,
              websiteUrl: tool.websiteUrl,
              likeCount: tool.likeCount || 0,
              saveCount: tool.saveCount || 0,
              toolType: tool.toolType || 'browser',
              about: tool.about,
              category: tool.category,
              keywords: tool.keywords || []
            }))
          ];

          return allTools;
        }
      }

      // If no exact tool found, return empty array for specific tool queries
      return [];
    }

    // Case 2: Category queries (like "ALL IN ONE AI TOOLS")
    const isCategoryQuery = keywords.some(keyword => 
      keyword.toLowerCase().includes('all') && 
      keyword.toLowerCase().includes('one')
    );

    if (isCategoryQuery) {
      // For category queries, prioritize exact category matches
      const categoryKeywords = keywords.filter(k => 
        k.length > 2 && 
        !['ai', 'tool', 'tools', 'automation', 'productivity', 'software', 'assistant', 'platform', 'app', 'application'].includes(k.toLowerCase())
      );

      const tools = await Tool.aggregate([
        {
          $match: {
            isActive: true,
            $or: [
              // Exact category match gets highest priority
              { category: { $regex: new RegExp(categoryKeywords.join('|'), 'i') } },
              // Partial category match
              { category: { $regex: new RegExp(categoryKeywords.map(k => k.split(/\s+/).join('|')).join('|'), 'i') } }
            ]
          }
        },
        {
          $addFields: {
            popularityScore: {
              $add: ['$likeCount', '$saveCount']
            },
            // Calculate relevance score for category queries
            relevanceScore: {
              $add: [
                // Exact category match gets highest score
                { $cond: [{ $regexMatch: { input: '$category', regex: categoryKeywords.join('|'), options: 'i' } }, 50, 0] },
                // Partial category match
                { $cond: [{ $regexMatch: { input: '$category', regex: categoryKeywords.map(k => k.split(/\s+/).join('|')).join('|'), options: 'i' } }, 30, 0] },
                // About section relevance
                { $cond: [{ $regexMatch: { input: '$about', regex: categoryKeywords.join('|'), options: 'i' } }, 15, 0] },
                // Keyword array matches
                { $cond: [{ $gt: [{ $size: { $setIntersection: ['$keywords', categoryKeywords] } }, 0] }, 10, 0] },
                // Bonus for multiple keyword matches
                { $cond: [{ $gt: [{ $size: { $setIntersection: ['$keywords', categoryKeywords] } }, 1] }, 10, 0] }
              ]
            }
          }
        },
        {
          $sort: { relevanceScore: -1, popularityScore: -1 }
        },
        {
          $limit: 5 // Return top 5 tools
        }
      ]);

      // Sort tools by popularity (likeCount + saveCount) in descending order
      const sortedTools = tools
        .map(tool => ({
          id: tool._id?.toString() || '',
          title: tool.title,
          logoUrl: tool.logoUrl,
          websiteUrl: tool.websiteUrl,
          likeCount: tool.likeCount || 0,
          saveCount: tool.saveCount || 0,
          toolType: tool.toolType || 'browser',
          about: tool.about,
          category: tool.category,
          keywords: tool.keywords || []
        }))
        .sort((a, b) => (b.likeCount + b.saveCount) - (a.likeCount + a.saveCount));

      return sortedTools;
    }

    // Case 3: General keyword-based search with improved MongoDB query
    // Filter out generic keywords that cause too many false matches
    const meaningfulKeywords = keywords.filter(k => 
      k.length > 2 && 
      !['ai', 'tool', 'tools', 'automation', 'productivity', 'software', 'assistant', 'platform', 'app', 'application', 'related'].includes(k.toLowerCase())
    );

    // If no meaningful keywords, try to find tools that match the original keywords but with better scoring
    const searchKeywords = meaningfulKeywords.length > 0 ? meaningfulKeywords : keywords;

    // Enhanced MongoDB query with better ranking
    const tools = await Tool.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            // Title matches (highest priority)
            { title: { $regex: searchKeywords.join('|'), $options: 'i' } },
            // Category matches
            { category: { $regex: searchKeywords.join('|'), $options: 'i' } },
            // About section matches
            { about: { $regex: searchKeywords.join('|'), $options: 'i' } },
            // Keywords array matches
            { keywords: { $in: searchKeywords.map(k => new RegExp(k, 'i')) } }
          ]
        }
      },
      {
        $addFields: {
          popularityScore: {
            $add: ['$likeCount', '$saveCount']
          },
          // Calculate relevance score with improved weighting for specific keywords
          relevanceScore: {
            $add: [
              // Title matches get highest priority
              { $cond: [{ $regexMatch: { input: '$title', regex: searchKeywords.join('|'), options: 'i' } }, 40, 0] },
              // Category matches
              { $cond: [{ $regexMatch: { input: '$category', regex: searchKeywords.join('|'), options: 'i' } }, 25, 0] },
              // About section matches
              { $cond: [{ $regexMatch: { input: '$about', regex: searchKeywords.join('|'), options: 'i' } }, 15, 0] },
              // Keyword array matches
              { $cond: [{ $gt: [{ $size: { $setIntersection: ['$keywords', searchKeywords] } }, 0] }, 12, 0] },
              // Bonus for multiple keyword matches
              { $cond: [{ $gt: [{ $size: { $setIntersection: ['$keywords', searchKeywords] } }, 1] }, 10, 0] },
              // Bonus for exact title matches
              { $cond: [{ $regexMatch: { input: '$title', regex: `^${searchKeywords.join('|')}$`, options: 'i' } }, 30, 0] },
              // Penalty for generic tool names that cause false matches
              { $cond: [{ $regexMatch: { input: '$title', regex: '^(ai|tool|software|assistant|platform)$', options: 'i' } }, -20, 0] },
              // Penalty for tools with very generic descriptions
              { $cond: [{ $regexMatch: { input: '$about', regex: '^(ai|tool|software|assistant|platform)', options: 'i' } }, -15, 0] },
              // Bonus for tools that match multiple meaningful keywords
              { $cond: [{ $gt: [{ $size: { $setIntersection: ['$keywords', meaningfulKeywords] } }, 1] }, 15, 0] },
              // Special bonus for tools that match specific high-value keywords
              { $cond: [{ $regexMatch: { input: '$category', regex: 'image|generator|art|design|creative', options: 'i' } }, 20, 0] },
              { $cond: [{ $regexMatch: { input: '$about', regex: 'image|generator|art|design|creative', options: 'i' } }, 15, 0] },
              { $cond: [{ $regexMatch: { input: '$title', regex: 'image|generator|art|design|creative', options: 'i' } }, 25, 0] }
            ]
          }
        }
      },
      {
        $sort: { relevanceScore: -1, popularityScore: -1 }
      },
      {
        $match: {
          // Only include tools with a minimum relevance score to avoid false matches
          relevanceScore: { $gte: 10 }
        }
      },
      {
        $limit: 5 // Return top 5 tools for general keyword queries
      }
    ]);

    // Filter out tools that don't seem relevant to the search query
    const relevantTools = tools.filter(tool => {
      // If the tool has a very low relevance score, it's probably not relevant
      if (tool.relevanceScore < 15) {
        return false;
      }
      
      // Check if the tool's title, category, or about section contains any of the meaningful keywords
      const toolText = `${tool.title} ${tool.category || ''} ${tool.about || ''}`.toLowerCase();
      const hasRelevantKeywords = meaningfulKeywords.length > 0 ? 
        meaningfulKeywords.some(keyword => toolText.includes(keyword.toLowerCase())) :
        searchKeywords.some(keyword => toolText.includes(keyword.toLowerCase()));
      
      return hasRelevantKeywords;
    });

    // Sort tools by popularity (likeCount + saveCount) in descending order
    const sortedTools = relevantTools
      .map(tool => ({
        id: tool._id?.toString() || '',
        title: tool.title,
        logoUrl: tool.logoUrl,
        websiteUrl: tool.websiteUrl,
        likeCount: tool.likeCount || 0,
        saveCount: tool.saveCount || 0,
        toolType: tool.toolType || 'browser',
        about: tool.about,
        category: tool.category,
        keywords: tool.keywords || []
      }))
      .sort((a, b) => (b.likeCount + b.saveCount) - (a.likeCount + a.saveCount));

    return sortedTools;
  } catch (error) {
    console.error('Error searching tools:', error);
    
    // Log the specific error for debugging
    if (error instanceof Error) {
      console.error('Database connection error details:', error.message);
      
      // If it's a connection error, we should still return an empty array
      // but log it for monitoring
      if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
        console.error('❌ Database connection failed - AI chatbot will use fallback responses');
      }
    }
    
    return [];
  }
}

// Generate intelligent response using GROQ
async function generateIntelligentResponse(userMessage: string, tools: ToolResult[], searchIntent: { intent: string; keywords: string[]; isSpecificTool: boolean }): Promise<string> {
  if (!GROQ_CHATBOT_API_KEY) {
    return generateFallbackResponse(userMessage, tools);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_CHATBOT_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `Generate a concise response about AI tools. Use exact likeCount/saveCount values. Keep it brief and helpful.

User: "${userMessage}"
Tools: ${tools.map((t, index) => `${index + 1}. ${t.title} - ${t.about} - ❤️${t.likeCount} 💾${t.saveCount}`).join('\n')}

Respond naturally and briefly.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    clearTimeout(timeoutId);

    if (!groqResponse.ok) {
      console.error('GROQ API error for response generation:', groqResponse.status);
      return generateFallbackResponse(userMessage, tools);
    }

    const data: GroqResponse = await groqResponse.json();
    const response = data.choices?.[0]?.message?.content?.trim();

    if (!response) {
      return generateFallbackResponse(userMessage, tools);
    }

    return response;

  } catch (error) {
    console.error('Error generating intelligent response:', error);
    return generateFallbackResponse(userMessage, tools);
  }
}

// Fallback response generator
function generateFallbackResponse(userMessage: string, tools: ToolResult[]): string {
  if (tools.length === 0) {
    // Check if this looks like a specific tool query
    const isSpecificToolQuery = userMessage.toLowerCase().includes('tell me about') || 
                               userMessage.toLowerCase().includes('what is') ||
                               userMessage.toLowerCase().includes('show me');
    
    // Check if this looks like a specific tool name request
    const specificToolPatterns = [
      /tell me about (.+)/i,
      /what is (.+)/i,
      /show me (.+)/i,
      /i want (.+)/i,
      /find (.+)/i
    ];
    
    let specificToolName = null;
    for (const pattern of specificToolPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        specificToolName = match[1].trim();
        break;
      }
    }
    
    if (isSpecificToolQuery && specificToolName) {
      return `We don't have **${specificToolName}** in our database yet, but we'll be adding it soon! 🚀\n\n` +
             `In the meantime, you can:\n` +
             `• Try searching for similar tools\n` +
             `• Browse our categories to discover other AI tools\n` +
             `• Check back later as we're constantly adding new tools\n\n` +
             `If you're looking for a specific type of tool, let me know and I can help you find alternatives!`;
    }
    
    // Check if this looks like a category request
    const categoryPatterns = [
      /tools for (.+)/i,
      /(.+) tools/i,
      /ai tools for (.+)/i,
      /(.+) ai tools/i
    ];
    
    let categoryName = null;
    for (const pattern of categoryPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        categoryName = match[1].trim();
        break;
      }
    }
    
    if (categoryName) {
      return `We don't have **${categoryName}** tools in our database yet, but we'll be adding them soon! 🚀\n\n` +
             `In the meantime, you can:\n` +
             `• Try searching for specific tool names\n` +
             `• Browse our existing categories\n` +
             `• Check back later as we're constantly adding new tools\n\n` +
             `If you're looking for a specific type of tool, let me know and I can help you find alternatives!`;
    }
    
    return `Sorry, I couldn't find a matching tool for your request right now. But we're always updating our database! 🚀\n\n` +
           `You can:\n` +
           `• Try searching for similar tools\n` +
           `• Browse our categories to discover other AI tools\n` +
           `• Check back later as we're constantly adding new tools\n\n` +
           `💡 **Tip**: If you're looking for specific tools, try asking about popular AI tools like "ChatGPT", "Midjourney", or "Cursor AI".`;
  }

  // Check if this looks like a specific tool query
  const isSpecificToolQuery = userMessage.toLowerCase().includes('tell me about') || 
                             userMessage.toLowerCase().includes('what is') ||
                             userMessage.toLowerCase().includes('show me');

  if (isSpecificToolQuery && tools.length > 1) {
    // For specific tool queries with multiple results (exact tool + category tools)
    const exactTool = tools[0]; // First tool is the exact match
    const categoryTools = tools.slice(1); // Rest are from same category
    
    let response = `Here's what I found about **${exactTool.title}**:\n\n`;
    if (exactTool.about) {
      response += `${exactTool.about}\n\n`;
    }
    
    if (categoryTools.length > 0) {
      response += `Here are some other great tools from the same category:\n\n`;
      categoryTools.forEach((tool, index) => {
        response += `${index + 1}. **${tool.title}**\n`;
        if (tool.about) {
          response += `   ${tool.about}\n`;
        }
        response += '\n';
      });
    }
    
    response += `These tools should help you with what you're looking for!`;
    return response;
  }

  if (isSpecificToolQuery && tools.length === 1) {
    // For specific tool queries with one result, focus on that tool
    const tool = tools[0];
    let response = `Here's what I found about **${tool.title}**:\n\n`;
    if (tool.about) {
      response += `${tool.about}\n\n`;
    }
    response += `This tool should help you with what you're looking for!`;
    return response;
  }

  // For general queries (Case 2: top tools)
  const topTools = tools.slice(0, 5); // Ensure we only show top 5
  const toolCount = topTools.length;
  const category = tools[0]?.category || 'AI Tools';
  
  let response = `🎯 Discover the Best AI Tools! 🎯\n\nI've searched our database and found ${toolCount} excellent AI tool${toolCount !== 1 ? 's' : ''} that match your query for "${userMessage}." Here are the top ${toolCount} tool${toolCount !== 1 ? 's' : ''}, in order of popularity:\n\n`;
  
  topTools.forEach((tool, index) => {
    response += `${index + 1}. 🖼️ **${tool.title}**\n`;
    response += `📛 Category: ${tool.category}\n`;
    if (tool.about) {
      response += `📝 About: ${tool.about}\n`;
    }
    response += `❤️ Like Count: ${tool.likeCount}\n`;
    response += `💾 Save Count: ${tool.saveCount}\n`;
    response += `🔗 Website URL: (Visit)\n\n`;
  });
  
  if (toolCount > 0) {
    response += `These tool${toolCount !== 1 ? 's' : ''} will help you with your specific needs. If you'd like to explore more tools in the same category, click on the 🔘 "View More Tools →" button below to visit the ${category} category page.\n\n`;
    response += `🔘 **View More Tools →**\n\nHope this helps! 😊`;
  }
  
  return response;
}

// Log requested tools that aren't in the database
function logRequestedTool(userMessage: string, searchIntent: { intent: string; keywords: string[]; isSpecificTool: boolean }) {
  try {
    // Extract tool name or category from user message
    let requestedTool = null;
    
    if (searchIntent.isSpecificTool && searchIntent.keywords.length > 0) {
      requestedTool = searchIntent.keywords.join(' ');
    } else {
      // Try to extract from general queries
      const patterns = [
        /tools for (.+)/i,
        /(.+) tools/i,
        /ai tools for (.+)/i,
        /(.+) ai tools/i,
        /i want (.+)/i,
        /find (.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = userMessage.match(pattern);
        if (match && match[1]) {
          requestedTool = match[1].trim();
          break;
        }
      }
    }
    
    if (requestedTool) {
      console.log(`🔍 [MISSING TOOL REQUEST] User requested: "${requestedTool}" | Query: "${userMessage}" | Intent: ${searchIntent.intent}`);
      
      // You can extend this to save to a database or send notifications
      // For now, we'll just log it to the console
    }
  } catch (error) {
    console.error('Error logging requested tool:', error);
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'AI Agent API',
    description: 'Scalable AI tool finder with intelligent search and GROQ integration.',
    usage: {
      method: 'POST',
      body: {
        message: 'string - Your search query'
      },
      example: {
        message: 'Tell me about Cursor AI'
      }
    }
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, getRateLimiter('/ai-agent'));
    if (rateLimitResult) {
      return rateLimitResult;
    }

    if (!GROQ_CHATBOT_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' }, 
        { status: 503 }
      );
    }

    // Parse and validate request body
    let body: AIRequestBody;
    try {
      const rawBody = await req.text();
      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty. Please provide a JSON body with a "message" field.' }, 
          { status: 400 }
        );
      }
      
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body. Please provide valid JSON with a "message" field.' }, 
        { status: 400 }
      );
    }
    
    const { message } = body;

    if (!validateMessage(message)) {
      return NextResponse.json(
        { error: 'Invalid message. Must be a non-empty string under 1000 characters.' }, 
        { status: 400 }
      );
    }

    console.log('🔍 Processing message:', message);

    // STEP 1: Check for inappropriate content
    const contentFilter = isInappropriateQuery(message);
    if (contentFilter.isInappropriate) {
      console.log('🚫 Inappropriate query detected:', contentFilter.reason);
      
      return NextResponse.json<AIResponse>({
        answer: `I cannot help you with ${contentFilter.reason}. I'm designed to assist with legitimate AI tool searches and recommendations. Please ask about legal and ethical AI tools that can help with your legitimate needs.`,
        tools: [], // No tools for inappropriate queries
        moreLink: '/category', // Default to main category page for inappropriate queries
        isExactMatch: false,
        toolNotFound: false
      });
    }

    // STEP 2: Extract search intent and keywords using GROQ
    const searchIntent = await extractSearchIntent(message);
    console.log('🎯 Search intent:', searchIntent);

    // STEP 3: Search tools in database
    const tools = await searchTools(searchIntent.keywords, searchIntent.isSpecificTool);
    console.log('🔍 Found tools:', tools.length);
    console.log('🔍 Tools found:', tools.map(t => ({ title: t.title, category: t.category })));

    // Log requested tools that aren't found
    if (tools.length === 0) {
      logRequestedTool(message, searchIntent);
    }

    // STEP 4: Generate intelligent response
    const answer = await generateIntelligentResponse(message, tools, searchIntent);

    // STEP 4: Return response with missing tool information
    // Generate moreLink based on the found tool's category, or default to 'ai-tools'
    let moreLink = '/category/ai-tools';
    if (tools.length > 0) {
      // Use the category of the first found tool
      const toolCategory = tools[0].category;
      if (toolCategory) {
        // URL encode the category name to handle spaces and special characters
        // Convert to lowercase first to match the existing category link pattern
        const encodedCategory = encodeURIComponent(toolCategory.toLowerCase());
        moreLink = `/category/${encodedCategory}`;
      }
    }
    
    const response: AIResponse = {
      answer,
      tools,
      moreLink,
      isExactMatch: searchIntent.isSpecificTool && tools.length > 0
    };

    // Add missing tool information if no tools found
    if (tools.length === 0) {
      // Check if this looks like a specific tool request
      const specificToolPatterns = [
        /tell me about (.+)/i,
        /what is (.+)/i,
        /show me (.+)/i,
        /i want (.+)/i,
        /find (.+)/i
      ];
      
      for (const pattern of specificToolPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          response.missingTool = match[1].trim();
          break;
        }
      }
      
      // Check if this looks like a category request
      if (!response.missingTool) {
        const categoryPatterns = [
          /tools for (.+)/i,
          /(.+) tools/i,
          /ai tools for (.+)/i,
          /(.+) ai tools/i
        ];
        
        for (const pattern of categoryPatterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            response.missingCategory = match[1].trim();
            break;
          }
        }
      }
    }

    return NextResponse.json<AIResponse>(response);

  } catch (error) {
    console.error('AI Agent Error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
      : 'Internal server error';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
