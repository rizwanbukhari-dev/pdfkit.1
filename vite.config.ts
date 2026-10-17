import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

function apiContactPlugin(): Plugin {
  const handlerMiddleware = (middlewares: any) => {
    middlewares.use('/api/contact', async (req: any, res: any) => {
      try {
        // @ts-ignore
        const { default: handler } = await import('./api/contact.js');
        let data = '';
        req.on('data', (chunk: any) => {
          data += chunk;
        });
        req.on('end', async () => {
          try {
            req.body = data ? JSON.parse(data) : {};
          } catch {
            req.body = data;
          }
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          res.json = (json: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(json));
            return res;
          };
          await handler(req, res);
        });
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  };

  return {
    name: 'api-contact-middleware',
    configureServer(server) {
      handlerMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      handlerMiddleware(server.middlewares);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiContactPlugin()],
});
