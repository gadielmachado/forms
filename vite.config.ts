import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    port: 3000,
    strictPort: false,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    // Configurações específicas para ajudar no build do Vercel
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignora avisos específicos que podem causar falhas no build
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        warn(warning);
      },
    },
    // Desativa o uso de builders nativos que podem causar problemas
    target: 'es2015',
    sourcemap: mode !== 'production'
  }
}));
