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
    let message = '[create-subscription] function triggered';
    context.log(message);
    splunk.logInfo(message);

    // Currently only supporting call records
    let resource = "/communications/callRecords";

    // Create a Date 2 days in the future for the exipiration time.
    let expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 2);
    let subscriptionBody = {
        "changeType":"created, updated",
        "notificationUrl": req.originalUrl.replace("create-subscription", "subscription-webhook"),
        "resource": resource,
        "expirationDateTime": expirationDateTime.toISOString()
    }

    await containerClient.createIfNotExists()
        .catch((err) => {
            context.log.error(err);
            splunk.logError(`[create-subscription] ${JSON.stringify(err)}`);
            context.res = {
                body: `Error creating subscription blob container: ${JSON.stringify(err, null, 4)}`
            };
            return;
        });

    await graph.createSubscription(subscriptionBody)
        .then((subscription) => {
            msg = `[create-subscription] created subscription: ${JSON.stringify(subscription, null, 4)}`
            context.log(msg);
            splunk.logInfo(msg);
            return subscription;
        })
        .then((subscription) => {
            // Persist the subscription details to a blob.
            // A timer function will update the subscription expirationDateTime if needed.

            subscriptionBlobItem = {
                "subscriptionId": subscription.id,
                "subscriptionExpirationDateTime": subscription.expirationDateTime
            }

            let blobContent = JSON.stringify(subscriptionBlobItem);
            let blobName = subscription.id;
            let blockBlobClient = containerClient.getBlockBlobClient(blobName);
            blockBlobClient
                .upload(blobContent, Buffer.byteLength(blobContent))
                .catch((err) => {
                    throw new Error(`The subscription was created, but there was an error writing the subscription contents to a blob container. Details: ${err}`)
                });
            let msg = `[create-subscription] successfully created subscription: ${JSON.stringify(subscription, null, 4)}`
            context.log(msg);
            splunk.logInfo(msg);
            context.res = {
                body: msg
            };
        })
        .catch((err) => {
            context.log.error(err);
            splunk.logError(JSON.stringify(err));
            context.res = {
                body: `[create-subscription] error: ${JSON.stringify(err, null, 4)}`
            };
            return;
        });
};