/**
 * Unified dev server — Vite on port 5173 with API plugin
 *
 * Run: npm run dev
 * Single server. API at /api/* via vite-plugin-api, frontend by Vite.
 */
import { createServer } from 'vite';

const PORT = Number(process.env.PORT) || 5173;

createServer().then((vite) => {
  vite.listen(PORT, () => {
    console.log(`Jasmine dev: http://localhost:${PORT} (API + Vite)`);
  });
}).catch((e) => {
  console.error('Failed to start dev server:', e);
  process.exit(1);
});
