"use strict";
const WebSocket = require("ws");
let debug = false,
  ws,
  chatAuth,
  chatUser,
  pingTimer,
  listenForPingTimer,
  lastPing = 0;

const stopPingTimer = () => {
  clearInterval(pingTimer);
  clearInterval(listenForPingTimer);
};

const startPingTimer = () => {
  stopPingTimer();

  pingTimer = setInterval(() => {
    sendMessage(`PING :${chatUser}`);
  }, 5 * 60 * 1000);

  listenForPingTimer = setInterval(() => {
    // once a min check the time since the last ping from twitch.
    // if too long as past then kill the ws connection to start a reconnection
    if (Math.floor(Date.now() / 1000 - lastPing) >= 10 * 60 * 1000) {
      console.log("Its been a while since twitch pinged us, reconnecting.");
      ws.close();
    }
  }, 60 * 1000);
};

// Function to send a message to twitch, I'm going to put in some kind of
// message queue in here but for now just send the message to tmi.
const sendMessage = (message) => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.error("Client not connected.");
    ws.close();
    return;
  }
  if (message.startsWith("PASS oauth:")) console.log(`< PASS oauth:*****`);
  else console.log(`< ${message}`);
  ws.send(message);
};

const setLastPing = () => {
  lastPing = Math.floor(Date.now() / 1000);
};

const startChat = async (twitchChatAuth, debugFlag) => {
  chatAuth = twitchChatAuth;
  debug = debugFlag;
  ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  ws.on("open", () => {
    if (!chatAuth.startsWith("oauth:")) {
      chatAuth = `oauth:${chatAuth}`;
    }
    sendMessage(`PASS ${chatAuth}`);
    // We don't actually need to send the correct
    // username for the tmi oauth, just "something".
    sendMessage(`NICK fakeuser`);
  });

  // TODO on WS Close - attempt to reconenct.
  ws.on("close", () => {
    console.log("Disconnected from chat, reconnecting.");
    stopPingTimer();
    setTimeout(() => {
      startChat(chatAuth, debug);
    }, 500);
  });

  ws.on("message", (data) => {
    data.split(/\r?\n/).forEach((line) => {
      if (line.length === 0) return;
      console.log(`> ${line}`);

      if (line.startsWith(":tmi.twitch.tv 376 ")) {
        sendMessage("CAP REQ :twitch.tv/commands");
        chatUser = line.split(" ")[2]; // This is a bit of a hack - but it works :-P
        startPingTimer();
        setLastPing();
      }

      if (line.startsWith("PING :tmi.twitch.tv")) {
        setLastPing();
        sendMessage("PONG :tmi.twitch.tv");
      }

      if (line.startsWith(`:tmi.twitch.tv PONG tmi.twitch.tv :${chatUser}`)) {
        setLastPing();
      }

      if (line.startsWith(":tmi.twitch.tv RECONNECT")) {
        console.log("Twitch requested a reconnect.");
        ws.close();
      }
    });
  });
};

// I might tweak the ws export in order to limit the exposer of the ws object.
module.exports = {
  startChat,
  sendMessage,
  ws: () => {
    return ws;
  },
};
