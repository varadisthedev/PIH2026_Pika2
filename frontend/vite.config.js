import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "ab81-2401-4900-881f-d3f8-7e4d-7458-3989-198b.ngrok-free.app"
    ]
  }
});