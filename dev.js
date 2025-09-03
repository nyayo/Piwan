const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const os = require("os");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") }); 

let ngrokUrl = null;

// Function to detect the operating system and open new terminal tabs
const openInNewTab = (command, title, workingDir = __dirname) => {
  const platform = os.platform();
  
  if (platform === 'darwin') {
    // macOS - using osascript to open new Terminal tabs
    const script = `
      tell application "Terminal"
        activate
        tell application "System Events" to tell process "Terminal" to keystroke "t" using command down
        delay 0.5
        do script "cd ${workingDir} && echo '=== ${title} ===' && ${command}" in selected tab of the front window
      end tell
    `;
    exec(`osascript -e '${script}'`);
  } else if (platform === 'win32') {
    // Windows - using start command with new window
    exec(`start "${title}" cmd /k "cd /d ${workingDir} && echo === ${title} === && ${command}"`);
  } else {
    // Linux - try different terminal emulators
    const terminals = [
      // Kitty terminal (popular on Arch)
      `kitty @ launch --type=tab --tab-title="${title}" --cwd="${workingDir}" bash -c "echo '=== ${title} ===' && ${command}; exec bash"`,
      // Alternative kitty command if the above doesn't work
      `kitty --title="${title}" bash -c "cd ${workingDir} && echo '=== ${title} ===' && ${command}; exec bash" &`,
      // Alacritty (popular on Arch)
      `alacritty --title="${title}" --working-directory="${workingDir}" -e bash -c "echo '=== ${title} ===' && ${command}; exec bash" &`,
      // Terminator
      `terminator --new-tab --title="${title}" --working-directory="${workingDir}" -e "bash -c 'echo \"=== ${title} ===\" && ${command}; exec bash'" &`,
      // GNOME Terminal
      `gnome-terminal --tab --title="${title}" --working-directory="${workingDir}" -- bash -c "echo '=== ${title} ==='; ${command}; exec bash"`,
      // Konsole (KDE)
      `konsole --new-tab --workdir "${workingDir}" -e bash -c "echo '=== ${title} ==='; ${command}; exec bash" &`,
      // st (suckless terminal)
      `st -t "${title}" -e bash -c "cd ${workingDir} && echo '=== ${title} ===' && ${command}; bash" &`,
      // xterm (fallback)
      `xterm -T "${title}" -e "cd ${workingDir} && echo '=== ${title} ===' && ${command}; bash" &`
    ];
    
    // Try each terminal until one works
    let terminalOpened = false;
    for (const terminalCmd of terminals) {
      try {
        exec(terminalCmd, (error) => {
          if (!error) {
            console.log(`✅ Opened ${title} in new terminal tab`);
          }
        });
        terminalOpened = true;
        break;
      } catch (error) {
        continue;
      }
    }
    
    if (!terminalOpened) {
      console.log(`⚠️  Could not open new tab for ${title}. Running in current terminal.`);
      console.log(`💡 Try installing one of: kitty, alacritty, gnome-terminal, konsole, terminator`);
      return spawn("bash", ["-c", command], { cwd: workingDir, stdio: "inherit" });
    }
  }
  return null;
};

// Function to wait for ngrok tunnel and extract URL
const waitForNgrokUrl = () => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout waiting for ngrok tunnel'));
    }, 30000); // 30 second timeout

    const checkNgrok = async () => {
      try {
        // Try to get tunnel info from ngrok API (v7 runs API on port 4040 by default)
        const response = await fetch('http://localhost:4040/api/tunnels');
        if (response.ok) {
          const data = await response.json();
          const tunnel = data.tunnels.find(t => t.proto === 'https');
          if (tunnel && tunnel.public_url) {
            clearTimeout(timeout);
            resolve(tunnel.public_url);
            return;
          }
        }
      } catch (error) {
        // ngrok API not ready yet, continue checking
      }
      
      // Check again in 1 second
      setTimeout(checkNgrok, 1000);
    };
    
    checkNgrok();
  });
};

(async function startDev() {
  // Read port from backend/.env or fallback to 5000
  const backendPort = process.env.PORT || 5000;
  const backendPath = path.join(__dirname, "backend", "server.js");
  const envPath = path.join(__dirname, "frontend", ".env");

  console.log("🌐 Starting ngrok tunnel in new terminal tab...");
  const ngrokCommand = `ngrok http ${backendPort}`;
  openInNewTab(ngrokCommand, "Ngrok Tunnel", __dirname);

  console.log("⏳ Waiting for ngrok tunnel to establish...");
  try {
    ngrokUrl = await waitForNgrokUrl();
    console.log(`✅ Ngrok public URL: ${ngrokUrl}`);
    
    console.log("📝 Writing to frontend .env...");
    // Append /api to the ngrok URL for the API base URL
    const apiUrl = `${ngrokUrl}/api`;
    // Write in the format that @env expects
    const envContent = `API_BASE_URL=${apiUrl}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Frontend .env file updated with API URL: ${apiUrl}`);
  } catch (error) {
    console.error("❌ Failed to get ngrok tunnel URL:", error.message);
    console.log("💡 Make sure ngrok is installed and the tunnel tab opened successfully");
    process.exit(1);
  }

  // Wait a moment for .env file to be written
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("🚀 Opening backend server in new terminal tab...");
  const backendCommand = `cd ${__dirname} && npx nodemon -r dotenv/config ${backendPath} dotenv_config_path=./backend/.env`;
  openInNewTab(backendCommand, "Backend Server", __dirname);

  console.log("📱 Opening frontend server in new terminal tab...");
  const frontendCommand = "npx expo start";
  const frontendDir = path.join(__dirname, "frontend");
  openInNewTab(frontendCommand, "Frontend Server", frontendDir);

  console.log("\n✅ All services starting in separate terminal tabs!");
  console.log(`🌐 Backend running on: http://localhost:${backendPort}`);
  console.log(`🌍 Public URL: ${ngrokUrl}`);
  console.log(`📱 Frontend starting with Expo...`);
  
  console.log("\n📋 Terminal Tabs:");
  console.log("1. 🌐 Ngrok Tunnel - Shows ngrok status and traffic");
  console.log("2. 🚀 Backend Server - Shows backend logs");  
  console.log("3. 📱 Frontend Server - Shows Expo logs");
  console.log("4. 🎛️  Main Control - This tab (press Ctrl+C to show shutdown options)");

  console.log("\n💡 Tips:");
  console.log("- Visit http://localhost:4040 to see ngrok web interface");
  console.log("- Close individual tabs to stop specific services");
  console.log("- Press Ctrl+C here for graceful shutdown of all services");

  // Keep the main process alive
  process.on("SIGINT", async () => {
    console.log("\n🛑 Graceful shutdown initiated...");
    console.log("📋 To fully stop all services:");
    console.log("1. Close the 'Ngrok Tunnel' tab (or press Ctrl+C in it)");
    console.log("2. Close the 'Backend Server' tab (or press Ctrl+C in it)"); 
    console.log("3. Close the 'Frontend Server' tab (or press Ctrl+C in it)");
    console.log("\n✅ Main control process stopped.");
    process.exit();
  });

  // Keep the process running
  setInterval(() => {
    // Just keep alive, the servers run in their own tabs
  }, 5000);
})();