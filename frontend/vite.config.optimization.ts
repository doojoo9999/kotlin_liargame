import {defineConfig, splitVendorChunkPlugin} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';
import {visualizer} from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react({
      // React optimization
      babel: {
        plugins: [
          // Remove development-only code
          process.env.NODE_ENV === 'production' && ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
          // Tree shaking for lodash
          ['babel-plugin-lodash'],
        ].filter(Boolean),
      },
    }),
    
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
    
    // Bundle analyzer (only in build)
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  build: {
    // Production optimizations
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
      mangle: {
        safari10: true,
      },
    },

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI libraries
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-tabs', 'lucide-react'],
          
          // State management and utilities  
          'state-vendor': ['zustand', 'axios'],
          
          // WebSocket and real-time
          'realtime-vendor': ['@stomp/stompjs', 'sockjs-client'],
          
          // Development tools (will be excluded in production)
          ...(process.env.NODE_ENV === 'development' && {
            'dev-vendor': ['@types/react', '@types/react-dom'],
          }),
        },
        
        // Naming strategy for chunks
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') return 'js/vendor.[hash].js';
          if (chunkInfo.name?.includes('vendor')) return `js/${chunkInfo.name}.[hash].js`;
          return 'js/[name].[hash].js';
        },
        
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'css/[name].[hash].css';
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name || '')) return 'images/[name].[hash][extname]';
          return 'assets/[name].[hash][extname]';
        },
      },
    },

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Source maps for production debugging
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },

  // Development optimizations
  server: {
    // HMR optimizations
    hmr: {
      overlay: false,
    },
    
    // Proxy for API calls (if needed)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    },
  },

  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'axios',
      '@stomp/stompjs',
      'sockjs-client',
      'lucide-react',
    ],
    
    // Exclude these from pre-bundling (if they cause issues)
    exclude: [],
    
    // ESBuild options for dependency optimization
    esbuildOptions: {
      target: 'esnext',
    },
  },

  // CSS optimizations
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        // Additional SCSS optimizations if using SCSS
        additionalData: `$injectedColor: orange;`,
      },
    },
  },

  // Define global constants for optimization
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production',
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});

// Performance monitoring configuration
export const performanceConfig = {
  // Core Web Vitals thresholds
  metrics: {
    FCP: 1800,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    FID: 100,   // First Input Delay
    CLS: 0.1,   // Cumulative Layout Shift
  },
  
  // Bundle size limits
  budgets: {
    initial: 244, // KB
    anyScript: 244,
    anyStylesheet: 47,
  },
  
  // Lazy loading strategies
  lazyLoading: {
    images: true,
    routes: true,
    components: true,
  },
};