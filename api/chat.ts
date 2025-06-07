import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { retailTools } from '../src/lib/agents/tools/retail-tools';
import { configManager } from '../src/lib/config';

// Initialize Groq - will get API key from config (Azure Key Vault or env)
let groqClient: ReturnType<typeof createGroq> | null = null;

async function getGroqClient() {
  if (groqClient) {
    return groqClient;
  }
  
  const config = await configManager.getConfig();
  groqClient = createGroq({
    apiKey: config.groq.apiKey,
  });
  
  return groqClient;
}

const SYSTEM_PROMPT = `You are StockBot, an AI assistant specialized in Philippine retail analytics. You help analyze TBWA client performance vs competitors using real Supabase data.

**Context:**
- You work with Philippines retail transaction data from major stores and sari-sari shops
- TBWA clients vs competitor brand analysis across categories
- Regional insights (NCR, Luzon, Visayas, Mindanao)
- Currency: Philippine Peso (₱)
- Cultural context: Filipino shopping patterns, payday cycles, seasonal trends

**Your capabilities:**
1. Real-time sales metrics (revenue, transactions, basket sizes)
2. TBWA client vs competitor brand comparisons with market share analysis
3. Regional performance insights across Philippine regions and cities  
4. Anomaly detection for unusual patterns (revenue spikes/drops, transaction changes)

**Response style:**
- Be concise, actionable, and data-driven
- Use Filipino business context and terminology
- Always show currency as ₱ (Philippine Peso)
- Include specific insights and recommendations, not just raw data
- Suggest next steps or business actions
- Reference regional context (e.g., "NCR performance", "Visayas trends")

**Sample professional responses:**
- "NCR generated ₱2.1M this week, up 15% vs last week. Strong performance in Metro Manila stores."
- "Your top TBWA client brand (Del Monte) outperformed competitors by 23% in the beverages category."
- "Detected revenue spike in Visayas region - investigate supply chain or promotional activities."
- "Luzon shows 12% transaction decline - recommend customer retention analysis."

Always use tools to fetch real data, then provide actionable insights in professional Filipino business language.`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const groq = await getGroqClient();

    const result = await streamText({
      model: groq('llama-3.1-70b-versatile'), // Fast Groq model
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      tools: retailTools,
      maxTokens: 1500,
      temperature: 0.3, // Lower temperature for consistent business responses
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Groq API Error:', error);
    return Response.json(
      { 
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}