import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Simple production build configuration without complex plugins
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || "0.1.0"),
    global: 'globalThis',
    'process.env': {},
    'process': '{}',
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('react')) return 'react-vendor';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('@radix-ui')) return 'ui-vendor';
          if (id.includes('recharts')) return 'recharts';
        },
      },
    },
  },
});