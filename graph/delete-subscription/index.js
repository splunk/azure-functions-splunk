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

const { BlobServiceClient } = require("@azure/storage-blob");
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env["AzureWebJobsStorage"]);
const containerClient = blobServiceClient.getContainerClient('subscriptions');
const graph = require('../helpers/graph');
const splunk = require('../helpers/splunk');

module.exports = async function (context, req) {
    let msg = '[delete-subscription] function triggered';
    context.log(msg);
    splunk.logInfo(msg);

    if (req.query.subscriptionId || (req.body && req.body.subscriptionId)) {
        subscriptionId = (req.query.subscriptionId || req.body.subscriptionId);

        await graph.deleteSubscription(subscriptionId)
            .then(() => {
                msg = `[delete-subscription] deleted subscription with ID ${subscriptionId}`
                context.log(msg);
                splunk.logInfo(msg);
                containerClient.deleteBlob(subscriptionId);
                context.res = {
                    body: msg
                }
            })
            .catch((err) => {
                context.log.error(err);
                splunk.logError(`[delete-subscription] ${JSON.stringify(err)}`);
                context.res = {
                    body: `Error: ${JSON.stringify(err, null, 4)}`
                };
            });
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a subscriptionId on the query string or in the request body."
        };
    }
};