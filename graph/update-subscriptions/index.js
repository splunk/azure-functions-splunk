const { BlobServiceClient, BlockBlobClient } = require("@azure/storage-blob");
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env["AzureWebJobsStorage"]);
const containerClient = blobServiceClient.getContainerClient('subscriptions');
const graph = require('../helpers/graph');

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
        context.res = {
            body: `Error getting blobs: ${err}`
        };
        return;
    }

    // Loop through the subscriptions and check if they need updating.
    for (let i = 0; i < subscriptionsToCheck.length; i++) {
        let subscription = subscriptionsToCheck[i];

        if (!subscriptionExpiresSoon(subscription.subscriptionExpirationDateTime)) {
            continue;
        }

        // Create a Date 1 day in the future
        let now = new Date();
        let newSubscriptionExpirationDateTime = new Date(now.setDate(now.getDate() + 1)).toISOString();
        
        await graph.updateSubscriptionExpiration(subscription.subscriptionId, newSubscriptionExpirationDateTime)
            .catch((err) => {
                if (err.statusCode = 404) {
                    // Looks like this subscription was removed, so remove it from the blob container.
                    context.log.warn(`A subscription with subscription Id '${subscription.subscriptionId}' was not found from Graph. Removing the blob item...`);
                    containerClient.deleteBlob(subscription.subscriptionId);
                } else {
                    let errorMsg = `Cloud not update subscription from Graph: ${subscriptions[i]}, error: ${err}`
                    context.log.error(errorMsg);
                    context.res = {
                        body: errorMsg
                    };
                    return;
                }
            });

    }
};

function subscriptionExpiresSoon(expirationDateTime) {

    let subscriptionExpirationDateTime = Date.parse(expirationDateTime);

    // Create a Date 1 day in the future
    let now = new Date();
    let futureDateTime = now.setDate(now.getDate() + 1);

    // If the subscription's expiration date is less than one day in the future, 
    // we will consider it close to expiration and renew.
    return subscriptionExpirationDateTime < futureDateTime;
}