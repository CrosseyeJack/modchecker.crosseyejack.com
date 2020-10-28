"use strict";
const express = require("express");
const WebSocket = require("ws");
const twitchChat = require("./twitchWebsocket");
const app = express();

const twitchUsernameRegex = /^([a-z0-9_]{4,25})$/i,
  noCacheString = "private, max-age=0, no-cache",
  cacheString = "public, min-fresh=60, max-age=3600, must-revalidate",
  contentTypeString = "application/json",
  queryTimeout = 500;

app.use(express.json());
app.get("/:channel", (req, res) => handleChannelMods(req, res)); // return all the mods of a channel.
app.get("/:channel/:user", (req, res) => handleChannelModsCheck(req, res)); // return a simple yes/no of :user is a mod of :channel

const handleChannelMods = (req, res) => {
  if (!("channel" in req.params)) {
    res.writeHead(500, {
      "Content-Type": contentTypeString,
      "Cache-Control": noCacheString,
    });
    res.end(
      JSON.stringify({ error: "params", errormsg: "Invalid parameters." })
    );
    return;
  }

  let channelName = req.params.channel.toLowerCase();

  // Simple username validation check
  if (!channelName.match(twitchUsernameRegex)) {
    res.writeHead(500, {
      "Content-Type": contentTypeString,
      "Cache-Control": noCacheString,
    });
    res.end(
      JSON.stringify({ error: "params", errormsg: "Invalid parameters." })
    );
    return;
  }

  getMods(channelName)
    .then((modList) => {
      res.writeHead(200, {
        "Content-Type": contentTypeString,
        "Cache-Control": cacheString,
      });
      res.end(JSON.stringify(modList));
      return;
    })
    .catch((error) => {
      res.writeHead(500, {
        "Content-Type": contentTypeString,
        "Cache-Control": noCacheString,
      });
      res.end(
        JSON.stringify({
          error: "twitch",
          errormsg: "Unable to communicate with Twitch. Try again later.",
        })
      );
      return;
    });
};

// FIXME Prob gonna rewrite this to cut down on the reused code.
const handleChannelModsCheck = (req, res) => {
  if (!("channel" in req.params) || !("user" in req.params)) {
    res.writeHead(500, {
      "Content-Type": contentTypeString,
      "Cache-Control": noCacheString,
    });
    res.end(
      JSON.stringify({ error: "params", errormsg: "Invalid parameters." })
    );
    return;
  }

  const channelName = req.params.channel.toLowerCase(),
    user = req.params.user.toLowerCase();

  // Simple username validation check
  if (
    !channelName.match(twitchUsernameRegex) ||
    !user.match(twitchUsernameRegex)
  ) {
    res.writeHead(500, {
      "Content-Type": contentTypeString,
      "Cache-Control": noCacheString,
    });
    res.end(
      JSON.stringify({ error: "params", errormsg: "Invalid parameters." })
    );
    return;
  }

  getMods(channelName)
    .then((modList) => {
      if (modList.includes(user))
        res.writeHead(200, {
          "Content-Type": contentTypeString,
          "Cache-Control": cacheString,
        });
      else
        res.writeHead(404, {
          "Content-Type": contentTypeString,
          "Cache-Control": cacheString,
        });
      res.end(JSON.stringify(modList));
      return;
    })
    .catch((error) => {
      res.writeHead(500, {
        "Content-Type": contentTypeString,
        "Cache-Control": noCacheString,
      });
      res.end(
        JSON.stringify({
          error: "twitch",
          errormsg: "Unable to communicate with Twitch. Try again later.",
        })
      );
      return;
    });
};

const getMods = (channelName) => {
  return new Promise((resolve, reject) => {
    const ws = twitchChat.ws(),
      timeoutObj = setTimeout(() => {
        ws.removeEventListener("message", messageProcessor);
        reject();
      }, queryTimeout);

    const messageProcessor = (data) => {
      data.split(/\r?\n/).forEach((line) => {
        if (line.length === 0) return;
        // TODO Add a check for "there are no moderators"
        if (
          line.startsWith(
            `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are:`
          )
        ) {
          ws.removeEventListener("message", messageProcessor);
          clearInterval(timeoutObj);
          const modList = data
            .substring(
              `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are: `
                .length
            )
            .trim()
            .split(", ");
          // if the channel owner is not in the mod list - add them, they own the channel afterall.
          if (!modList.includes(channelName)) modList.push(channelName);
          resolve(modList.sort());
          return;
        } else if (
          line.startsWith(
            `:tmi.twitch.tv NOTICE #${channelName} :There are no moderators of this channel.`
          )
        ) {
          ws.removeEventListener("message", messageProcessor);
          clearInterval(timeoutObj);
          resolve([]); // No mods so just return an empty array.
          return;
        }
      });
    };

    // Check if the websocket connection is actually open.
    if (ws.readyState !== WebSocket.OPEN) {
      clearInterval(timeoutObj);
      reject();
      return;
    }

    // bind the message listener and send the mod list request
    ws.on("message", messageProcessor);
    twitchChat.sendMessage(`PRIVMSG #${channelName} :.mods`);
  });
};

module.exports = {
  init: (host, port) => {
    return new Promise((resolve, reject) => {
      try {
        app.listen(port, host, () => {
          console.log(`Webserver listening on: http://${host}:${port}`);
        });
        return resolve();
      } catch (error) {
        return reject(error);
      }
    });
  },
};
