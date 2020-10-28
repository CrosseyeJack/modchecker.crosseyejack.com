"use strict";
const express = require("express");
const WebSocket = require("ws");
const app = express();

const twitchChat = require("./twitchWebsocket");

app.use(express.json());
app.get("/:channel", (req, res) => handleChannelMods(req, res)); // return all the mods of a channel.
app.get("/:channel/:user", (req, res) => handleChannelModsCheck(req, res)); // return a simple yes/no of :user is a mod of :channel

// FIXME Prob gonna rewrite this to cut down on the reused code.
const handleChannelModsCheck = (req, res) => {
  if ("channel" in req.params && "user" in req.params) {
    const channelName = req.params.channel.toLowerCase(),
      user = req.params.user.toLowerCase(),
      ws = twitchChat.ws();
    if (ws.readyState !== WebSocket.OPEN) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "twitch",
          errormsg: "Unable to communicate with Twitch. Try again later.",
        })
      );
      return;
    }

    let timeoutObj, resolveObj;

    const messageProcessor = (data) => {
      data.split(/\r?\n/).forEach((line) => {
        if (line.length === 0) return;
        if (
          line.startsWith(
            `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are:`
          )
        ) {
          resolveObj(line);
          return;
        }
      });
    };
    new Promise((resolve, reject) => {
      resolveObj = resolve;
      timeoutObj = setTimeout(() => {
        reject();
      }, 2500);

      ws.on("message", messageProcessor);
      twitchChat.sendMessage(`PRIVMSG #${channelName} :.mods`);
    })
      .then((data) => {
        clearTimeout(timeoutObj);
        ws.removeEventListener("message", messageProcessor);

        const listOfMods = data
          .substring(
            `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are: `
              .length
          )
          .split(", ");
        if (listOfMods.includes(user)) {
          res.writeHead(200, {
            "Content-Type": "application/json",
            "Cache-Control":
              "public, min-fresh=60, max-age=3600, must-revalidate",
          });
          res.end(JSON.stringify(listOfMods));
          return;
        } else {
          res.writeHead(404, {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=0, no-cache",
          });
          res.end(JSON.stringify(listOfMods));
          return;
        }
      })
      .catch((error) => {
        ws.removeEventListener("message", messageProcessor);
        res.writeHead(503, {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=0, no-cache",
        });
        res.end(
          JSON.stringify({
            error: "twitch",
            errormsg:
              "Unable to communicate with Twitch. Try again later. Please double check the channel name, if the channel doesn't exist twitch won't tell me without another API call and I'm a lazy bum.",
          })
        );
        return;
      });
  } else {
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=0, no-cache",
    });
    res.end(JSON.stringify({ error: "Params", errormsg: "Params Not Found." }));
    return;
  }
};

const handleChannelMods = (req, res) => {
  if ("channel" in req.params) {
    let channelName = req.params.channel;
    const ws = twitchChat.ws();
    if (ws.readyState !== WebSocket.OPEN) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "twitch",
          errormsg: "Unable to communicate with Twitch. Try again later.",
        })
      );
      return;
    }

    let timeoutObj, resolveObj;

    const messageProcessor = (data) => {
      data.split(/\r?\n/).forEach((line) => {
        if (line.length === 0) return;
        if (
          line.startsWith(
            `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are:`
          )
        ) {
          resolveObj(line);
          return;
        }
      });
    };
    new Promise((resolve, reject) => {
      resolveObj = resolve;
      timeoutObj = setTimeout(() => {
        reject();
      }, 2500);

      ws.on("message", messageProcessor);
      twitchChat.sendMessage(`PRIVMSG #${channelName} :.mods`);
    })
      .then((data) => {
        clearTimeout(timeoutObj);
        ws.removeEventListener("message", messageProcessor);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, min-fresh=60, max-age=3600, must-revalidate",
        });
        res.end(
          JSON.stringify(
            data
              .substring(
                `:tmi.twitch.tv NOTICE #${channelName} :The moderators of this channel are: `
                  .length
              )
              .split(", ")
          )
        );
        return;
      })
      .catch((error) => {
        ws.removeEventListener("message", messageProcessor);
        res.writeHead(503, {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=0, no-cache",
        });
        res.end(
          JSON.stringify({
            error: "twitch",
            errormsg:
              "Unable to communicate with Twitch. Try again later. Please double check the channel name, if the channel doesn't exist twitch won't tell me without another API call and I'm a lazy bum.",
          })
        );
        return;
      });
  } else {
    res.writeHead(500, {
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=0, no-cache",
    });
    res.end(JSON.stringify({ error: "Params", errormsg: "Params Not Found." }));
    return;
  }
};

module.exports = {
  init: (host, port, debug) => {
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
