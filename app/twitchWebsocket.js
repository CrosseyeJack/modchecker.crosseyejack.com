const WebSocket = require("ws");
const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

let chatAuth, pingTimer;

const stopPingTimer = () => {
  clearInterval(pingTimer);
};

const startPingTimer = () => {
  stopPingTimer();
  setInterval(() => {
    sendMessage(`PING :${chatUser}`);
  }, 5 * 60 * 1000);
};

// Function to send a message to twitch, I'm going to put in some kind of message queue in here but for now just send the message to tmi.
const sendMessage = (message) => {
  console.log(`< ${message}`);
  ws.send(message);
};

exports.startChat = async (Settings) => {
  chatAuth = Settings.twitchChatAuth;

  ws.on("open", function open() {
    if (!chatAuth.startsWith("oauth:")) {
      chatAuth = `oauth:${chatAuth}`;
    }
    // sendMessage(`PASS ${chatAuth}`);
    sendMessage(`PASS ${chatAuth}`);
    sendMessage(`NICK fakeuser`);
  });

  // TODO on WS Close - attempt to reconenct.

  ws.on("message", function incoming(data) {
    data.split(/\r?\n/).forEach((line) => {
      if (line.length === 0) return;

      console.log(`> ${line}`);

      if (line.startsWith(":tmi.twitch.tv 376 ")) {
        sendMessage("CAP REQ :twitch.tv/commands");
        startPingTimer();
      }

      if (line.startsWith("PING :tmi.twitch.tv")) {
        sendMessage("PONG :tmi.twitch.tv");
      }
    });
  });
};
