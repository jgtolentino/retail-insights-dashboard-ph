import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || question.trim() === '') {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For now, we'll return a mock response since Azure OpenAI setup requires credentials
    // In production, you would:
    // 1. Import Azure OpenAI client
    // 2. Set up environment variables for AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT
    // 3. Call the completion API with a system prompt about the dashboard

    const mockResponses = {
      'how do i':
        'To navigate the dashboard, use the tabs at the top. Start with Overview to see system status, then explore IoT Devices for hardware monitoring, AI Insights for predictive analytics, and Architecture to understand our tech stack.',
      'what is':
        'This is the Project Scout dashboard - an IoT-powered retail insights platform. It monitors sari-sari store performance using real-time device data and AI analytics, built on Supabase and Vercel for 83% cost savings vs Azure.',
      cost: "We've achieved 83% cost savings ($3,156/year) by using Supabase + Vercel instead of Azure. The annual infrastructure cost is only $660 compared to Azure's $3,816.",
      device:
        "IoT devices monitor store transactions in real-time. Currently, we're ready for device registration and targeting 90 stores for deployment. Each device provides transaction data, customer behavior insights, and health monitoring.",
      ai: 'Our AI insights use Azure OpenAI to analyze Filipino consumer behavior, predict sales trends, and provide optimization recommendations. The AI processes transaction patterns and shopping behaviors specific to sari-sari stores.',
      data: "We've solved critical data integrity issues including device collision detection, session matching validation, and transaction integrity checks. This ensures accurate analytics and prevents data corruption.",
      tour: "You can take a guided tour by clicking the 'Take a Tour' button at the top of the page. It will walk you through all the key features step by step.",
      help: "I'm ScoutBot, your dashboard assistant! I can help with navigation, explain features, provide cost information, discuss our IoT setup, or answer questions about the AI analytics. What would you like to know?",
    };

    // Simple keyword matching for demo purposes
    const questionLower = question.toLowerCase();
    let answer =
      "I'm here to help with the Project Scout dashboard! You can ask me about IoT devices, cost savings, AI insights, data integrity, navigation, or taking a tour. What specific area interests you?";

    for (const [keyword, response] of Object.entries(mockResponses)) {
      if (questionLower.includes(keyword)) {
        answer = response;
        break;
      }
    }

    // Add some context-specific responses
    if (questionLower.includes('filter') || questionLower.includes('search')) {
      answer =
        'The dashboard uses intelligent filtering across all tabs. On Overview, you can see metrics at a glance. Use the IoT Devices tab to filter by device status, and AI Insights to filter by prediction type or time range.';
    } else if (questionLower.includes('error') || questionLower.includes('problem')) {
      answer =
        "If you're experiencing issues, try refreshing the page using the 'Refresh Status' button. Our system health is monitored in real-time. For data issues, our integrity checks automatically validate device sessions and transactions.";
    } else if (questionLower.includes('supabase') || questionLower.includes('vercel')) {
      answer =
        'We use Supabase for our PostgreSQL database with real-time subscriptions, and Vercel for edge deployment. This modern stack provides better performance, developer experience, and massive cost savings compared to traditional Azure services.';
    }

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({
        error: 'Sorry, I encountered an error. Please try again later.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// For production deployment with Azure OpenAI, uncomment and configure this:
/*
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-02-01",
});

async function getChatResponse(question: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are ScoutBot, a helpful assistant for the Project Scout retail insights dashboard. 
          
          Context: This is an IoT-powered dashboard for sari-sari stores in the Philippines. Key features:
          - Real-time device monitoring and health tracking
          - 83% cost savings using Supabase + Vercel vs Azure
          - AI insights for Filipino consumer behavior
          - Data integrity solutions for device collision issues
          - Architecture designed for 90 store deployment
          
          Answer questions about dashboard features, navigation, IoT devices, cost savings, AI analytics, and data integrity. 
          Be concise and helpful. If asked about technical details, explain in user-friendly terms.`
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 300,
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Azure OpenAI API error:', error);
    throw error;
  }
}
*/
