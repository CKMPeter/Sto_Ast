import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,

    https: {
      key: fs.readFileSync("../frontend/src/cert/key.pem"),
      cert: fs.readFileSync("../frontend/src/cert/cert.pem"),
    },

    proxy: {
      "/api": {
        target: "https://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});