"use strict";
const fs = require("fs");
const twitchChat = require("./app/twitchWebsocket");

// Varibles
let debug = true, // Spits out debug Messsages
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

  if (!Settings.twitchChatAuth) {
    console.error(
      `(ERROR) Unable to parse settings file. This is prob cause there is bad json in it. Check the file and relaunch.`
    );
    process.exit(1);
  }

  twitchChat.startChat(Settings);
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
