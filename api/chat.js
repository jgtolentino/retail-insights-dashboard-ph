export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Mock responses for the Project Scout dashboard
    const mockResponses = {
      'how do i': 'To navigate the dashboard, use the tabs at the top. Start with Overview to see system status, then explore IoT Devices for hardware monitoring, AI Insights for predictive analytics, and Analytics to see live transaction trends.',
      'what is': 'This is the Project Scout dashboard - an IoT-powered retail insights platform. It monitors sari-sari store performance using real-time device data and AI analytics, built on Supabase and Vercel for 83% cost savings vs Azure.',
      'cost': "We've achieved 83% cost savings ($3,156/year) by using Supabase + Vercel instead of Azure. The annual infrastructure cost is only $660 compared to Azure's $3,816.",
      'device': "IoT devices monitor store transactions in real-time. Currently, we're ready for device registration and targeting 90 stores for deployment. Each device provides transaction data, customer behavior insights, and health monitoring.",
      'ai': 'Our AI insights use Azure OpenAI to analyze Filipino consumer behavior, predict sales trends, and provide optimization recommendations. The AI processes transaction patterns and shopping behaviors specific to sari-sari stores.',
      'data': "We've solved critical data integrity issues including device collision detection, session matching validation, and transaction integrity checks. This ensures accurate analytics and prevents data corruption.",
      'tour': "You can take a guided tour by clicking the 'Take a Tour' button at the top of the page. It will walk you through all the key features step by step.",
      'help': "I'm ScoutBot, your dashboard assistant! I can help with navigation, explain features, provide cost information, discuss our IoT setup, or answer questions about the AI analytics. What would you like to know?",
      'chart': 'The Transaction Trends Chart in the Analytics tab shows hourly transaction patterns with two lines: blue for transaction count and yellow for average amount in PHP. It displays real data from our API with summary stats above the chart.',
      'trends': 'Visit the Analytics tab to see live transaction trends! The chart shows hourly patterns over the last 7 days, with peak hours typically around 12:00 PM. You can see both transaction volume and average spending amounts.',
      'analytics': 'The Analytics tab now features live Transaction Trends Charts and a Geospatial Heatmap! The trends show hourly patterns while the heatmap displays store performance across the Philippines with real IoT device data, organized by Luzon, Visayas, and Mindanao regions.',
      'heatmap': 'The Geospatial Heatmap shows all Philippine sari-sari stores on an interactive map organized by regions. Click on any store to see detailed performance metrics, device status, peak hours, and top products. You can filter by transactions or revenue.',
      'map': 'Our store network spans Metro Manila, Cebu, Davao, Baguio, Iloilo, and Cagayan de Oro. Each store has an IoT device providing real-time transaction data, customer footfall, and performance insights.',
      'stores': 'We monitor 15 active sari-sari stores across the Philippines. Each has unique names like "Tindahan ni Aling Rosa" and "Kuya Jun Store". You can see their exact locations, performance metrics, and device status in the Geospatial Heatmap.'
    };

    // Simple keyword matching for demo purposes
    const questionLower = question.toLowerCase();
    let answer = "I'm here to help with the Project Scout dashboard! You can ask me about IoT devices, cost savings, AI insights, data integrity, navigation, or taking a tour. What specific area interests you?";

    for (const [keyword, response] of Object.entries(mockResponses)) {
      if (questionLower.includes(keyword)) {
        answer = response;
        break;
      }
    }

    // Add some context-specific responses
    if (questionLower.includes('filter') || questionLower.includes('search')) {
      answer = 'The dashboard uses intelligent filtering across all tabs. On Overview, you can see metrics at a glance. Use the IoT Devices tab to filter by device status, and AI Insights to filter by prediction type or time range.';
    } else if (questionLower.includes('error') || questionLower.includes('problem')) {
      answer = "If you're experiencing issues, try refreshing the page using the 'Refresh Status' button. Our system health is monitored in real-time. For data issues, our integrity checks automatically validate device sessions and transactions.";
    } else if (questionLower.includes('supabase') || questionLower.includes('vercel')) {
      answer = 'We use Supabase for our PostgreSQL database with real-time subscriptions, and Vercel for edge deployment. This modern stack provides better performance, developer experience, and massive cost savings compared to traditional Azure services.';
    }

    res.status(200).json({ answer });

  } catch (error) {
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again later.' 
    });
  }
}