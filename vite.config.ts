import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import path from 'path'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          config: './tailwind.widget.config.ts',
        }),
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/main.tsx'),
      name: 'BizinAgent',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    outDir: 'public',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Ensure CSS is injected into JS
        assetFileNames: 'widget.[ext]',
      },
    },
    minify: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
})

