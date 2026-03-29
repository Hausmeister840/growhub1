import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: true,
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'react-core';
          }

          if (
            id.includes('/framer-motion/') ||
            id.includes('/lucide-react/') ||
            id.includes('/sonner/')
          ) {
            return 'ui-motion';
          }

          if (
            id.includes('/@radix-ui/') ||
            id.includes('/cmdk/') ||
            id.includes('/vaul/')
          ) {
            return 'radix-ui';
          }

          if (
            id.includes('/react-leaflet/') ||
            id.includes('/leaflet/') ||
            id.includes('/three/')
          ) {
            return 'maps-3d';
          }

          if (
            id.includes('/recharts/') ||
            id.includes('/victory-vendor/') ||
            id.includes('/d3-')
          ) {
            return 'charts';
          }

          if (
            id.includes('/jspdf/') ||
            id.includes('/html2canvas/') ||
            id.includes('/react-quill/')
          ) {
            return 'rich-media';
          }

          if (
            id.includes('/@base44/') ||
            id.includes('/@tanstack/react-query/') ||
            id.includes('/@supabase/') ||
            id.includes('/zod/') ||
            id.includes('/lodash/') ||
            id.includes('/date-fns/') ||
            id.includes('/moment/')
          ) {
            return 'data-stack';
          }
        },
      },
    },
  },
});
