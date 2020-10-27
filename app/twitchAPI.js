const { rejects } = require("assert");
const https = require("https");

let clientid = "", clientsecret = "";

const validateToken = async (token) => {
  if (token.startsWith("oauth:"))
    token = token.replace("oauth:", "");
  return await getUserFromToken(token).then((username) => {
    return username;
  }).catch(() => {
    return null;
  });
};

const getUserFromToken = async (token) => {
  return new Promise((resolve, reject) => {
    https
    .get({
      hostname: "api.twitch.tv",
      path:`/kraken/`,
      headers: {
        "Client-ID": clientid,
        "Authorization": `OAuth ${token}`,
        "Accept": "application/vnd.twitchtv.v5+json"
      }
    }, (resp) => {
      let data = "";

      // A chunk of data has been recieved.
      resp.on("data", (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on("end", () => {
        var returnedData = JSON.parse(data);
        if (!("token" in returnedData) || !("valid" in returnedData.token) || !returnedData.token.valid || !("user_name" in returnedData.token)) {
          // unable to contact twitch or validate the token....
          return reject();
        } else {
          return resolve(returnedData.token.user_name);
        }
      });
    })
    .on("error", (err) => {
      return reject();
    });

    https.get();
  });
};

exports.validateToken = validateToken;
exports.setClientid = (clientid) => {
  this.clientid = clientid;
};
exports.setClientsecret = (clientsecret) => {
  this.clientsecret = clientsecret;
};