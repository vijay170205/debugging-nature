import "dotenv/config";
import http from "http";
import { createApp } from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { initSocket } from "./src/socket.js";

const PORT = process.env.PORT || 5000;

async function main() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server, process.env.CORS_ORIGIN?.split(",") || "*");

  server.listen(PORT, () => {
    console.log(`\n🛰  GiriRakshak backend running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

main();
