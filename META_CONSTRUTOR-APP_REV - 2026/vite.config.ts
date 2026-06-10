import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteImagemin from "vite-plugin-imagemin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3, interlaced: false },
      optipng: { optimizationLevel: 5 },
      mozjpeg: { quality: 75 },
      pngquant: { quality: [0.7, 0.85], speed: 4 },
      webp: { quality: 80 },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        compact: true,
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

          // Agrupa pacotes pequenos e menos usados em vendor-misc para reduzir chunks
          if (["idb", "sonner", "re-resizable", "tslib", "clsx", "tailwind-merge"].includes(packageName)) {
            return "vendor-misc";
          }

          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
