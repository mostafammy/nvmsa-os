import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { generateLandingHtml } from './scripts/generate-landing.mjs';

/**
 * Generates static-first EN (index.html) and AR (ar/index.html) landing pages,
 * redirects legacy routes (/calendar, /admin, /app, /nvmsaos, /ar), and
 * rewrites dev requests for /nvmsaOs and /nvmsaOs/* SPA routes.
 */
function landingAndAppRouting(): Plugin {
  return {
    name: 'nvmsa-landing-and-app-routing',
    buildStart() {
      generateLandingHtml();
    },
    configureServer(server) {
      generateLandingHtml();
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? '';
        const qIndex = rawUrl.indexOf('?');
        const pathname = qIndex >= 0 ? rawUrl.slice(0, qIndex) : rawUrl;
        const search = qIndex >= 0 ? rawUrl.slice(qIndex) : '';

        const redirectTo = (targetPath: string) => {
          res.statusCode = 301;
          res.setHeader('Location', `${targetPath}${search}`);
          res.end();
        };

        if (pathname === '/ar') {
          return redirectTo('/ar/');
        }
        if (pathname === '/calendar' || pathname.startsWith('/calendar/')) {
          return redirectTo(`/nvmsaOs${pathname}`);
        }
        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
          return redirectTo(`/nvmsaOs${pathname}`);
        }
        if (pathname === '/app' || pathname.startsWith('/app/')) {
          return redirectTo(`/nvmsaOs${pathname.slice('/app'.length)}`);
        }
        const lower = pathname.toLowerCase();
        if (
          (lower === '/nvmsaos' || lower.startsWith('/nvmsaos/')) &&
          pathname !== '/nvmsaOs' &&
          !pathname.startsWith('/nvmsaOs/')
        ) {
          return redirectTo(`/nvmsaOs${pathname.slice('/nvmsaos'.length)}`);
        }

        if (pathname === '/ar/') {
          req.url = `/ar/index.html${search}`;
        } else if (
          (pathname === '/nvmsaOs' || pathname.startsWith('/nvmsaOs/')) &&
          !path.extname(pathname) &&
          req.headers.accept?.includes('text/html')
        ) {
          req.url = `/nvmsaOs/index.html${search}`;
        }
        next();
      });
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}src${path.sep}landing${path.sep}`) && file.endsWith('.ts')) {
        generateLandingHtml();
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  plugins: [landingAndAppRouting(), react(), tailwindcss(), cloudflare()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@client': path.resolve(__dirname, 'src/client'),
      '@server': path.resolve(__dirname, 'src/server'),
    },
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            // Keep the NVMSA OS SPA entry chunk named `index-*` for scripts/check-bundle-budget.mjs
            index: path.resolve(__dirname, 'nvmsaOs/index.html'),
            landing: path.resolve(__dirname, 'index.html'),
            landingAr: path.resolve(__dirname, 'ar/index.html'),
          },
        },
      },
    },
  },
});
