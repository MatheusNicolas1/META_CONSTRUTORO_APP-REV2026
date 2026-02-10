import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all addresses (:: or 0.0.0.0)
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'framer-motion', 'lucide-react', 'sonner'],
          'supabase-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          'charts-vendor': ['recharts'],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
