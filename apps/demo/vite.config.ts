import { defineConfig } from "vite";

// Fixed port: a site's allowed origin includes the port, so silently moving to another port
// (Vite's default when 5173 is busy) would make the ingest API reject the page with a 403.
export default defineConfig({ server: { port: 5173, strictPort: true } });
