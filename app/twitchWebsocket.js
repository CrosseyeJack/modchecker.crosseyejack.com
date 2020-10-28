const WebSocket = require("ws");
const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

let chatAuth, chatUser, pingTimer;

const stopPingTimer = () => {
  clearInterval(pingTimer);
};

const startPingTimer = () => {
  stopPingTimer();
  setInterval(() => {
    ws.send(`PING :${chatUser}`);
  }, 5 * 60 * 1000);
};

// Function to send a message to twitch, I'm going to put in some kind of message queue in here but for now just send the message to tmi.
const sendMessage = (message) => {
  console.log(`< ${message}`);
  ws.send(message);
};

exports.startChat = async (Settings) => {
  chatAuth = Settings.twitchChatAuth;
  chatUser = Settings.twitchChatUsername;

  ws.on("open", function open() {
    if (!chatAuth.startsWith("oauth:")) {
      chatAuth = `oauth:${chatAuth}`;
    }
    ws.send(`PASS ${chatAuth}`);
    ws.send(`NICK ${chatUser}`);
  });

  // TODO on WS Close - attempt to reconenct.

  ws.on("message", function incoming(data) {
    data.split(/\r?\n/).forEach((line) => {
      if (line.length === 0) return;
      switch (line) {
        case `:tmi.twitch.tv 376 ${chatUser} :>`:
          console.log("Connected to Chat");
          sendMessage("CAP REQ :twitch.tv/commands");
          startPingTimer();
          break;

        case "PING :tmi.twitch.tv":
          ws.send("PONG :tmi.twitch.tv");
          break;
      }
      console.log(`> ${line}`);
    });
  });
};
