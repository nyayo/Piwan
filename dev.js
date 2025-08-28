const ngrok = require("ngrok");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") }); // load backend .env

(async function startDev() {
  // Read port from backend/.env or fallback to 5000
  const backendPort = process.env.PORT || 5000;
  const backendPath = path.join(__dirname, "backend", "server.js");
  const envPath = path.join(__dirname, "frontend", ".env");

  console.log(`🚀 Starting backend on port ${backendPort} with nodemon...`);
  const backend = spawn("npx", ["nodemon", backendPath], { stdio: "inherit" });

  console.log("🌐 Starting ngrok tunnel...");
  const url = await ngrok.connect(backendPort);
  console.log(`✅ Ngrok public URL: ${url}`);

  console.log("📝 Writing to frontend .env...");
  fs.writeFileSync(envPath, `API_BASE_URL=${url}\n`);

  console.log("📱 Starting Expo frontend...");
  const expo = spawn("npx", ["expo", "start"], { cwd: path.join(__dirname, "frontend"), stdio: "inherit" });

  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    backend.kill();
    expo.kill();
    await ngrok.kill();
    process.exit();
  });
})();
