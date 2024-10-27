const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const WebSocket = require("ws");
const path = require("path");
const fs = require("fs");
const AutoLaunch = require("auto-launch");
const {
  setVolume,
  getVolume,
  mute,
  unmute,
  toggleMute,
  isMuted,
} = require("./volumeController");

let wss;
const configPath = "config.json";
let config = {
  websocket: { port: 8080, runOnStartup: true },
  polling: { enabled: false, interval: 1000 }, // Add default polling settings
};

// Load config
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath));
  } catch (error) {
    console.error("Error loading configuration:", error);
  }
}

const appLauncher = new AutoLaunch({
  name: "volume-controller",
  path: app.getPath("exe"),
});

// Function to enable or disable run on startup
const setAutoLaunch = (enabled) => {
  appLauncher
    .isEnabled()
    .then((isEnabled) => {
      if (enabled && !isEnabled) {
        return appLauncher.enable();
      } else if (!enabled && isEnabled) {
        return appLauncher.disable();
      }
    })
    .catch(console.error);
};

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    webPreferences: {
      contextIsolation: true, // Enable context isolation
      enableRemoteModule: false, // Disable remote module
      preload: path.join(__dirname, "renderer.js"),
    },
    show: false, // Start hidden
  });

  mainWindow.loadFile("index.html");
  mainWindow.openDevTools();

  mainWindow.setMenu(null);

  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
}

app.on("ready", () => {
  createWindow(); // Moved this to the beginning
  //   app.dock.hide();
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("load-config", config);
  });

  tray = new Tray(path.join(__dirname, "webicon.png"));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show App",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Your Application Name");
  tray.setContextMenu(contextMenu);
  //   tray.on("click", () => {
  //     mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  //   });

  // Set the auto-launch option based on the current config
  setAutoLaunch(config.websocket.runOnStartup);
  startWebSocketServer(); // Start WebSocket server

  // Save the config when a request is made from the renderer
  ipcMain.on("save-config", (event, newConfig) => {
    config = newConfig; // Update the config object in the main process
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2)); // Save it to the file
      event.reply("config-saved", "Configuration saved successfully!");

      // Set the auto-launch setting
      setAutoLaunch(config.websocket.runOnStartup);

      // Check if the WebSocket server is running, if so, close it
      if (wss) {
        wss.close(() => {
          console.log("WebSocket server closed.");
          startWebSocketServer(); // Restart the server with the new port
        });
      } else {
        startWebSocketServer(); // Start the server if it wasn't running
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      event.reply("config-saved", "Failed to save configuration.");
    }
  });
});

// Start the WebSocket server
function startWebSocketServer() {
  const port = config.websocket.port; // Access the correct port

  // Check that the port is valid
  if (typeof port !== "number" || port <= 0) {
    console.error("Invalid port specified in the configuration.");
    return;
  }

  // Initialize the WebSocket server with the specified port
  wss = new WebSocket.Server({ port });

  wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
      try {
        const { action, value } = JSON.parse(message);
        let response;

        switch (action) {
          case "setVolume":
            response = await setVolume(value);
            break;
          case "getVolume":
            response = await getVolume(); // Get volume action added back
            break;
          case "increaseVolume":
            response = await setVolume(value);
            break;
          case "decreaseVolume":
            response = await setVolume(-value);
            break;
          case "mute":
            response = await mute();
            break;
          case "unmute":
            response = await unmute();
            break;
          case "toggleMute":
            response = await toggleMute();
            break;
          case "isMuted":
            response = await isMuted();
            break;
          default:
            response = { error: "Invalid action" };
        }

        ws.send(JSON.stringify(response));
      } catch (error) {
        console.error("Error processing message:", error);
        ws.send(JSON.stringify({ error: "Failed to process message" }));
      }
    });
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  console.log(`WebSocket server is running on ws://localhost:${port}`);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
