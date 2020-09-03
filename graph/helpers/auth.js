const adal = require('adal-node');
const clientId = process.env["CLIENT_ID"];
const clientSecret = process.env["CLIENT_SECRET"];
const tenantId = process.env["TENANT_ID"];
const authority = `https://login.microsoftonline.com/${tenantId}`
const resource = 'https://graph.microsoft.com/';

const getAccessToken = function () {
  const authContext = new adal.AuthenticationContext(authority);
  return new Promise((resolve, reject) => {
    authContext.acquireTokenWithClientCredentials(resource, clientId, clientSecret, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token["accessToken"]);
      }
    });
  });
}

exports.getAccessToken = getAccessToken;