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

const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env["AzureWebJobsStorage"]);
const containerClient = blobServiceClient.getContainerClient('subscriptions');
const graph = require('../helpers/graph');
const splunk = require('../helpers/splunk');

// A helper method used to read a Node.js readable stream into string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

module.exports = async function (context, myTimer) {

    // Get the subscriptions from the blob container
    let subscriptionsToCheck = [];

    try {
        for await (let blob of containerClient.listBlobsFlat()) {
            let blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            let downloadBlockBlobResponse = await blockBlobClient.download(0);
            let subscription = await streamToString(downloadBlockBlobResponse.readableStreamBody);
            subscriptionsToCheck.push(JSON.parse(subscription));
            // Example subscription {"subscriptionId":"123","subscriptionExpirationDateTime":"YYYY-MM-DDThh:00:00.000Z"}
        }
    } catch(err) {
        context.log.error(err);
        splunk.logError(JSON.stringify(err));
        context.res = {
            body: `Error getting blobs: ${err}`
        };
        return;
    }

    // Loop through the subscriptions and check if they need updating.
    for (let i = 0; i < subscriptionsToCheck.length; i++) {
        let subscription = subscriptionsToCheck[i];
        splunk.logInfo(`[update-subscriptions] checking subscription ${JSON.stringify(subscription)}`);

        if (subscriptionHasExpired(subscription.subscriptionExpirationDateTime)) {
            let msg = `[update-subscriptions] a subscription with subscription Id '${subscription.subscriptionId}' has expired. Removing the blob item...`
            context.log.warn(msg);
            splunk.logWarning(msg);
            containerClient.deleteBlob(subscription.subscriptionId);
            continue;
        }

        if (!subscriptionExpiresSoon(subscription.subscriptionExpirationDateTime)) {
            continue;
        }

        // Create a Date 2 days in the future
        let expirationDateTime = new Date();
        expirationDateTime.setDate(expirationDateTime.getDate() + 2);
        let newSubscriptionExpirationDateTime = expirationDateTime.toISOString();
        splunk.logInfo(`[update-subscriptions] updating subscription ${JSON.stringify(subscription)}. New expiration: ${newSubscriptionExpirationDateTime}`);
        
        await graph.updateSubscriptionExpiration(subscription.subscriptionId, newSubscriptionExpirationDateTime)
            .then(() => {
                // Update the blob with the new subscription expiration 
                subscriptionBlobItem = {
                    "subscriptionId": subscription.subscriptionId,
                    "subscriptionExpirationDateTime": newSubscriptionExpirationDateTime
                }
                let blobContent = JSON.stringify(subscriptionBlobItem);
                let blobName = subscription.subscriptionId;
                let blockBlobClient = containerClient.getBlockBlobClient(blobName);
                blockBlobClient.upload(blobContent, blobContent.length);
            })
            .catch((err) => {
                let errorMsg = `[update-subscriptions] could not update subscription from Graph: ${subscription.subscriptionId}, error: ${JSON.stringify(err)}`
                context.log.error(errorMsg);
                splunk.logError(errorMsg);
                context.res = {
                    body: errorMsg
                };
                return;
            });

    }
};

function subscriptionHasExpired(expirationDateTime) {

    let subscriptionExpirationDateTime = Date.parse(expirationDateTime);

    let now = new Date();

    // has it expired
    return subscriptionExpirationDateTime < now;
}

function subscriptionExpiresSoon(expirationDateTime) {

    let subscriptionExpirationDateTime = Date.parse(expirationDateTime);

    // Create a Date 1 day in the future
    let now = new Date();
    let futureDateTime = now.setDate(now.getDate() + 1);

    // If the subscription's expiration date is less than one day in the future, 
    // we will consider it close to expiration and renew.
    return subscriptionExpirationDateTime < futureDateTime;
}