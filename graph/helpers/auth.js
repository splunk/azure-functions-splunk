/*
Copyright 2020 Splunk Inc. 

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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