"use strict";
const Sentry = require("@sentry/node");
const fs = require("fs");
const twitchChat = require("./app/twitchWebsocket");
const webServer = require("./app/webserver");

// Varibles
let debug = false, // Spits out debug Messsages
  port = 4521,
  Settings = {
    // The default settings
    twitchChatAuth: "", // Keep this out of the source
  };
// Constants
const settingsFileName = "./settings.json";

// Entry Point for the application
const entryPoint = async () => {
  if (debug) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Dev env doesn't like the twitch SSL Cert. I prob need to kick the cert package up the arse. But for deving I'm just bypassing the check :-P
  console.log("Twitch Mod Checker.");

  // A simple sanity check...
  if (Settings.twitchChatAuth) {
    console.error(
      "(ERROR) Do not put these values into the source. Why? Cause I don't want to accidently push them to the git."
    );
    process.exit(1);
  }

  // Load the settings file into the var.
  if (!fs.existsSync(settingsFileName)) {
    console.log(
      `(DEBUG) Settings file doesn't exist - create one from the default settings object`
    );
    saveSettings();
  }

  var buffer = fs.readFileSync(settingsFileName);
  try {
    Settings = JSON.parse(buffer);
  } catch (err) {
    console.error(
      `(ERROR) Unable to parse settings file. This is prob cause there is bad json in it. Check the file and relaunch.`
    );
    process.exit(1);
  }

  if ("debug" in Settings) {
    debug = Settings.debug;
  }

  if ("sentry" in Settings) {
    if (debug) console.log("Init Sentry!");
    Sentry.init({
      dsn: Settings.sentry,

      // We recommend adjusting this value in production, or using tracesSampler
      // for finer control
      tracesSampleRate: 1.0,
    });
  }

  if ("port" in Settings) {
    port = Settings.port;
  }

  if (!Settings.twitchChatAuth) {
    console.error(`(ERROR) twitchChatAuth missing from settings file.`);
    process.exit(1);
  }

  twitchChat.startChat(Settings.twitchChatAuth, debug);
  await webServer.init("localhost", port, debug).catch((error) => {
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
