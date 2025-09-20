const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");
const os = require("os");
const net = require("net");
require("dotenv").config({ path: path.join(__dirname, "backend", ".env") }); 

let ngrokUrl = null;
const lockFile = path.join(__dirname, '.dev-servers.lock');

// Function to check if a port is in use
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, (err) => {
      if (err) {
        resolve(true); // Port is in use
      } else {
        server.once('close', () => {
          resolve(false); // Port is free
        });
        server.close();
      }
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
};

// Function to check if ngrok is running
const isNgrokRunning = async () => {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Function to get existing ngrok URL
const getExistingNgrokUrl = async () => {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    if (response.ok) {
      const data = await response.json();
      const tunnel = data.tunnels.find(t => t.proto === 'https');
      return tunnel ? tunnel.public_url : null;
    }
  } catch (error) {
    return null;
  }
};

// Function to create/check lock file
const createLockFile = () => {
  const lockData = {
    pid: process.pid,
    timestamp: Date.now(),
    ports: {
      backend: process.env.PORT || 5000,
      ngrok: 4040,
      expo: 8081 // Default Expo port
    }
  };
  
  fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));
};

// Function to check if another instance is running
const isAnotherInstanceRunning = () => {
  if (!fs.existsSync(lockFile)) {
    return false;
  }
  
  try {
    const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    
    // Check if the process is still running (Unix-like systems)
    try {
      process.kill(lockData.pid, 0);
      return true; // Process exists
    } catch (error) {
      // Process doesn't exist, remove stale lock file
      fs.unlinkSync(lockFile);
      return false;
    }
  } catch (error) {
    // Invalid lock file, remove it
    fs.unlinkSync(lockFile);
    return false;
  }
};

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
  // Check if another instance is already running
  if (isAnotherInstanceRunning()) {
    console.log("🚫 Development servers are already running!");
    console.log("📋 Current services status:");
    
    // Check individual services
    const backendPort = process.env.PORT || 5000;
    const backendRunning = await isPortInUse(backendPort);
    const ngrokRunning = await isNgrokRunning();
    const expoRunning = await isPortInUse(8081);
    
    console.log(`🚀 Backend Server (port ${backendPort}): ${backendRunning ? '✅ Running' : '❌ Not running'}`);
    console.log(`🌐 Ngrok Tunnel (port 4040): ${ngrokRunning ? '✅ Running' : '❌ Not running'}`);
    console.log(`📱 Expo Server (port 8081): ${expoRunning ? '✅ Running' : '❌ Not running'}`);
    
    if (ngrokRunning) {
      const existingUrl = await getExistingNgrokUrl();
      if (existingUrl) {
        console.log(`🌍 Existing Public URL: ${existingUrl}`);
      }
    }
    
    console.log("\n💡 To stop all servers, close the terminal tabs or run:");
    console.log("   - pkill -f 'ngrok http'");
    console.log("   - pkill -f 'nodemon'");
    console.log("   - pkill -f 'expo start'");
    
    process.exit(0);
  }

  // Create lock file
  createLockFile();

  // Read port from backend/.env or fallback to 5000
  const backendPort = process.env.PORT || 5000;
  const envPath = path.join(__dirname, "frontend", ".env");

  // Check if services are already running individually
  const backendRunning = await isPortInUse(backendPort);
  const ngrokRunning = await isNgrokRunning();
  const expoRunning = await isPortInUse(8081);

  // Handle ngrok
  if (ngrokRunning) {
    console.log("🌐 Ngrok tunnel is already running!");
    ngrokUrl = await getExistingNgrokUrl();
    if (ngrokUrl) {
      console.log(`✅ Existing Ngrok URL: ${ngrokUrl}`);
    }
  } else {
    console.log("🌐 Starting ngrok tunnel in new terminal tab...");
    const ngrokCommand = `ngrok http ${backendPort}`;
    openInNewTab(ngrokCommand, "Ngrok Tunnel", __dirname);
    
    console.log("⏳ Waiting for ngrok tunnel to establish...");
    try {
      ngrokUrl = await waitForNgrokUrl();
      console.log(`✅ Ngrok public URL: ${ngrokUrl}`);
    } catch (error) {
      console.error("❌ Failed to get ngrok tunnel URL:", error.message);
      console.log("💡 Make sure ngrok is installed and the tunnel tab opened successfully");
      // Don't exit, continue with other services
    }
  }

  // Update frontend .env if we have ngrok URL
  if (ngrokUrl) {
    console.log("📝 Writing to frontend .env...");
    const apiUrl = `${ngrokUrl}/api`;
    const envContent = `API_BASE_URL=${apiUrl}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Frontend .env file updated with API URL: ${apiUrl}`);
  }

  // Wait a moment for .env file to be written
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Handle backend server
  if (backendRunning) {
    console.log(`🚀 Backend server is already running on port ${backendPort}!`);
  } else {
    console.log("🚀 Opening backend server in new terminal tab...");
    const backendCommand = `npx nodemon server.js`;
    const backendDir = path.join(__dirname, "backend");
    openInNewTab(backendCommand, "Backend Server", backendDir);
  }

  // Handle frontend server
  if (expoRunning) {
    console.log("📱 Expo server is already running on port 8081!");
  } else {
    console.log("📱 Opening frontend server in new terminal tab...");
    const frontendCommand = "npx expo start";
    const frontendDir = path.join(__dirname, "frontend");
    openInNewTab(frontendCommand, "Frontend Server", frontendDir);
  }

  console.log("\n✅ Development environment ready!");
  console.log(`🌐 Backend: http://localhost:${backendPort}`);
  if (ngrokUrl) {
    console.log(`🌍 Public URL: ${ngrokUrl}`);
  }
  console.log(`📱 Frontend: Expo development server`);
  
  console.log("\n📋 Active Services:");
  console.log("1. 🌐 Ngrok Tunnel - Shows ngrok status and traffic");
  console.log("2. 🚀 Backend Server - Shows backend logs");  
  console.log("3. 📱 Frontend Server - Shows Expo logs");
  console.log("4. 🎛️  Main Control - This tab (press Ctrl+C to show shutdown options)");

  console.log("\n💡 Tips:");
  console.log("- Visit http://localhost:4040 to see ngrok web interface");
  console.log("- Running this script again will detect existing services");
  console.log("- Press Ctrl+C here for graceful shutdown instructions");

  // Cleanup on exit
  const cleanup = async () => {
    console.log("\n🛑 Cleaning up...");
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
      console.log("🗑️  Lock file removed");
    }
  };

  // Keep the main process alive
  process.on("SIGINT", async () => {
    console.log("\n🛑 Graceful shutdown initiated...");
    console.log("📋 To fully stop all services:");
    console.log("1. Close the 'Ngrok Tunnel' tab (or press Ctrl+C in it)");
    console.log("2. Close the 'Backend Server' tab (or press Ctrl+C in it)"); 
    console.log("3. Close the 'Frontend Server' tab (or press Ctrl+C in it)");
    
    await cleanup();
    console.log("\n✅ Main control process stopped.");
    process.exit();
  });

  process.on("exit", cleanup);
  process.on("SIGTERM", cleanup);

  // Keep the process running
  setInterval(() => {
    // Just keep alive, the servers run in their own tabs
  }, 5000);
})();