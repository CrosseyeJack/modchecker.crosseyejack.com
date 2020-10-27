const WebSocket = require("ws");
const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

let chatAuth,
  chatUser,
  channelsToJoin = [],
  joinedChannels = [],
  pingTimer;

const stopPingTimer = () => {
  clearInterval(pingTimer);
};

const startPingTimer = () => {
  stopPingTimer();
  setInterval(() => {
    ws.send(`PING :${chatUser}`);
  }, 5 * 60 * 1000);
};

const joinChannels = (channels) => {
  channelsToJoin = channels;
  setInterval(() => {
    if (channelsToJoin.length >= 1) {
      let channelName = channelsToJoin.shift().toLowerCase();
      if (!channelName.startsWith("#")) channelName = `#${channelName}`;
      ws.send(`JOIN ${channelName}`);
    }
  }, 100);
};

exports.startChat = async (Settings) => {
  console.log(Settings);
  chatAuth = Settings.twitchChatAuth;
  chatUser = Settings.twitchChatUsername;

  ws.on("open", function open() {
    if (!chatAuth.startsWith("oauth:")) {
      chatAuth = `oauth:${chatAuth}`;
    }
    ws.send(`PASS ${chatAuth}`);
    ws.send(`NICK ${chatUser}`);
  });

  ws.on("message", function incoming(data) {
    data.split(/\r?\n/).forEach((line) => {
      console.log(`> ${line}`);
      switch (line) {
        case `:tmi.twitch.tv 376 ${chatUser} :>`:
          console.log("Connected to Chat");
          startPingTimer();
          joinChannels(Settings.channels);
          break;

        case "PING :tmi.twitch.tv":
          ws.send("PONG :tmi.twitch.tv");
          break;

        // TODO Catch this expression
        // :jacks_mod_checker_bot.tmi.twitch.tv 353 jacks_mod_checker_bot = #itmejp :jacks_mod_checker_bot
        // :<botusername>.tmi.twitch.tv 353 <botusername> = <#channelJoined> :<botusername>
      }
    });
  });
};
