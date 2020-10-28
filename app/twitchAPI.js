const https = require("https");

let clientid = "";

const validateToken = async (token) => {
  if (token.startsWith("oauth:")) token = token.replace("oauth:", "");
  return await getUserFromToken(token)
    .then((username) => {
      return username;
    })
    .catch(() => {
      return null;
    });
};

const getUserFromToken = async (token) => {
  // This is using the old v5 API to fetch the username for the auth token used. IIRC the last time I check the "New Twitch API" didn't have such a feature, but I might be mistaken or they might of actualy added it since I last check
  // TODO Check the twitch docs. I would rather not use the old API if I didn't have to.
  // However this call might not even be needed. I should be able to fake the USER string and get the real username from tmi on connection.
  return new Promise((resolve, reject) => {
    https
      .get(
        {
          hostname: "api.twitch.tv",
          path: `/kraken/`,
          headers: {
            "Client-ID": clientid,
            Authorization: `OAuth ${token}`,
            Accept: "application/vnd.twitchtv.v5+json",
          },
        },
        (resp) => {
          let data = "";

          // A chunk of data has been recieved.
          resp.on("data", (chunk) => {
            data += chunk;
          });

          // The whole data have been recieved, process it.
          resp.on("end", () => {
            try {
              var returnedData = JSON.parse(data);
              if (
                !("token" in returnedData) ||
                !("valid" in returnedData.token) ||
                !returnedData.token.valid ||
                !("user_name" in returnedData.token)
              ) {
                // unable to contact twitch or validate the token....
                return reject();
              } else {
                // return the username for the auth token
                return resolve(returnedData.token.user_name);
              }
            } catch (err) {
              // wasn't able to parse the json. just return an error
              return reject();
            }
          });
        }
      )
      .on("error", (err) => {
        return reject();
      });

    https.get();
  });
};

exports.initTwitchAPI = (settings) => {
  this.clientid = settings.setClientid;
};

exports.validateToken = validateToken;
