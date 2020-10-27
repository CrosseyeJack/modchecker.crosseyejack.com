'use strict';
const fs = require('fs');
const prompt = require("prompt-async");

// Varibles
let 
debug = true, // Spits out debug Messsages
Settings = { // The default settings
    twitchChatAuth: "", // Keep these out of the source
}
;

// Constants
const settingsFileName = "./settings.json";

// Entry Point for the application
const entryPoint = async () => {
    if (debug) console.log(`(DEBUG) Start of entryPoint()`);
    console.log("Twitch Mod Checker.");

    // A simple sanity check...
    if (Settings.twitchChatAuth) 
    {
        console.error("(ERROR) Do not put these values into the source. Why? Cause I don't want to accidently push them to the git.");
        process.exit(1)
    }

    // Load the settings file into the var.
    if (!fs.existsSync(settingsFileName))
    {
        console.log(`(DEBUG) Settings file doesn't exist - create one from the default settings object`);
        saveSettings();
    }

    var buffer = fs.readFileSync(settingsFileName);
    try {
        Settings = JSON.parse(buffer);
    } catch (err) {
        console.error(`(ERROR) Unable to parse settings file. This is prob cause there is bad json in it. Check the file and relaunch.`);
        process.exit(1);
    }

    if (!Settings.twitchChatAuth) {
        prompt.start();
        while (true)
        {
            console.log(`Twitch Chat Auth is empty, please enter it now (or adjust settings.json and relaunch this application)`);
            let {chatAuth} = await prompt.get(["chatAuth"]);
            // TODO Do a simple validation on the auth string here
            if (chatAuth) {
                // Set the settings object
                Settings.twitchChatAuth = chatAuth
                break; // Break out of the while loop.
            }
        }
        prompt.stop();
        // Save the settings object
        saveSettings();
    }

    startTwitchChatConnection();
    if (debug) console.log(`(DEBUG) End of entryPoint()`);
};

const startTwitchChatConnection = () => {
    console.log("Hit up twitch with our demands...");
};

const saveSettings = () => {
    if (debug) console.log(`(DEBUG) Writting out settings file.`);
        try {
        fs.writeFileSync(settingsFileName, JSON.stringify(Settings, null, 2));
    } catch (err) {
        console.error(`(ERROR) Unable to write out default settings file, This is prob a premissions issue!`);
        process.exit(1);
    }
};

// Lets get this party started...
entryPoint();