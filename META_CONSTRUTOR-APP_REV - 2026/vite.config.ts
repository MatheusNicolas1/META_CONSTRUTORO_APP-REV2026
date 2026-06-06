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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          const nodeModulesPath = normalizedId.split("/node_modules/")[1];
          if (!nodeModulesPath) return undefined;

          const parts = nodeModulesPath.split("/");
          const packageName = parts[0].startsWith("@")
            ? `${parts[0]}/${parts[1]}`
            : parts[0];

          if (["react", "react-dom", "react-router-dom", "scheduler"].includes(packageName)) {
            return "vendor-react";
          }
          if (packageName.startsWith("@supabase")) return "vendor-supabase";
          if (packageName.startsWith("@tanstack")) return "vendor-query";
          if (packageName.startsWith("@stripe")) return "vendor-payments";
          if (packageName.startsWith("@sentry")) return "vendor-observability";
          if (packageName === "framer-motion") return "vendor-motion";
          if (packageName === "recharts") return "vendor-charts";
          if (packageName === "date-fns" || packageName === "react-day-picker") return "vendor-date";
          if (packageName === "lucide-react" || packageName.startsWith("@radix-ui")) return "vendor-ui";
          if (packageName === "posthog-js") return "vendor-analytics";
          if (packageName === "libphonenumber-js") return "vendor-phone";
          if (packageName === "zod" || packageName === "react-hook-form") return "vendor-forms";
          if (packageName === "@hello-pangea/dnd") return "vendor-dnd";

          return undefined;
        },
      },
    },
  },
}));
