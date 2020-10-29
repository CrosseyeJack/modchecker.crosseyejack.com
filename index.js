"use strict";
const Sentry = require("@sentry/node");
const fs = require("fs");
const twitchChat = require("./app/twitchWebsocket");
const webServer = require("./app/webserver");

// Varibles
let debug = false, // Spits out debug Messsages
  port = 4521,
  Settings = {
    debug: false,
    port: 4521,
    sentry: "",
  };
// Constants
const settingsFileName = "./settings.json";

// Entry Point for the application
const entryPoint = async () => {
  console.log("Twitch Mod Checker.");

  // Load the settings file into the var.
  if (!fs.existsSync(settingsFileName)) {
    console.log(
      `(DEBUG) Settings file doesn't exist - create one from the default settings object`
    );
    saveSettings();
  }

  try {
    Settings = JSON.parse(fs.readFileSync(settingsFileName));
  } catch (err) {
    console.error(
      `(ERROR) Unable to parse settings file. This is prob cause there is bad json in it. Check the file and relaunch.`
    );
    process.exit(1);
  }

  if ("debug" in Settings && Settings.debug === "boolean") {
    debug = Settings.debug;
  }

  if (debug) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Dev env doesn't like the twitch SSL Cert. I prob need to kick the cert package up the arse. But for deving I'm just bypassing the check :-P

  if ("sentry" in Settings) {
    if (Settings.sentry && typeof Settings.sentry === "string") {
      if (debug) console.log("Init Sentry!");
      Sentry.init({
        dsn: Settings.sentry,
        tracesSampleRate: 1.0,
      });
    }
  }

  if ("port" in Settings && typeof Settings.port === "number") {
    port = Settings.port;
  }

  twitchChat.startChat();
  await webServer.init("localhost", port).catch((error) => {
    console.error(error);
    process.exit(1);
  });
};

const saveSettings = () => {
  try {
    fs.writeFileSync(settingsFileName, JSON.stringify(Settings, null, 2));
  } catch (err) {
    console.error(
      `(ERROR) Unable to write out default settings file, This is prob a premissions issue!`
    );
    process.exit(1);
  }
};

// Lets get this party started...
entryPoint();
