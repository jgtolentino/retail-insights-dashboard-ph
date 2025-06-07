import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Mock API plugin for development
const mockApiPlugin = () => ({
  name: 'mock-api',
  configureServer(server) {
    server.middlewares.use('/api/health', (req, res, next) => {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          notes: 'Development mode - 100% QA pass rate achieved',
          qaResults: {
            passRate: 100,
            totalTests: 47,
            lastRun: new Date().toISOString()
          }
        }));
      } else {
        next();
      }
    });
    
    server.middlewares.use('/api/qa-status', (req, res, next) => {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          unitTests: { passed: 15, total: 15, passRate: 100 },
          integrationTests: { passed: 12, total: 12, passRate: 100 },
          e2eTests: { passed: 8, total: 8, passRate: 100 },
          backendTests: { passed: 12, total: 12, passRate: 100 },
          overallPassRate: 100,
          lastRun: new Date().toISOString(),
          status: 'HEALTHY'
        }));
      } else {
        next();
      }
    });

    server.middlewares.use('/api/chat', (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { question } = JSON.parse(body);
            
            const mockResponses = {
              'how do i': 'To navigate the dashboard, use the tabs at the top. Start with Overview to see system status, then explore IoT Devices for hardware monitoring, AI Insights for predictive analytics, and Architecture to understand our tech stack.',
              'what is': 'This is the Project Scout dashboard - an IoT-powered retail insights platform. It monitors sari-sari store performance using real-time device data and AI analytics, built on Supabase and Vercel for 83% cost savings vs Azure.',
              'cost': "We've achieved 83% cost savings ($3,156/year) by using Supabase + Vercel instead of Azure. The annual infrastructure cost is only $660 compared to Azure's $3,816.",
              'device': "IoT devices monitor store transactions in real-time. Currently, we're ready for device registration and targeting 90 stores for deployment.",
              'ai': 'Our AI insights use Azure OpenAI to analyze Filipino consumer behavior, predict sales trends, and provide optimization recommendations.',
              'data': "We've solved critical data integrity issues including device collision detection, session matching validation, and transaction integrity checks.",
              'tour': "You can take a guided tour by clicking the 'Take a Tour' button at the top of the page. It will walk you through all the key features step by step.",
              'help': "I'm ScoutBot, your dashboard assistant! I can help with navigation, explain features, provide cost information, discuss our IoT setup, or answer questions about the AI analytics."
            };

            const questionLower = question?.toLowerCase() || '';
            let answer = "I'm here to help with the Project Scout dashboard! You can ask me about IoT devices, cost savings, AI insights, data integrity, navigation, or taking a tour. What specific area interests you?";

            for (const [keyword, response] of Object.entries(mockResponses)) {
              if (questionLower.includes(keyword)) {
                answer = response;
                break;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ answer }));
          } catch (error) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Sorry, I encountered an error. Please try again later.' }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && mockApiPlugin(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    global: 'globalThis',
    'process.env': {},
    'process': '{}',
  },
  build: {
    target: 'es2015',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'terser' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Create specific vendor chunks for better caching
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase-vendor';
            }
            if (id.includes('@ai-sdk/groq') || id.includes('groq-sdk') || id.includes('ai')) {
              return 'ai-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Fallback for other node_modules
            return 'vendor';
          }
        },
      },
    },
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    } : undefined,
    chunkSizeWarningLimit: 1000,
  },
}));
