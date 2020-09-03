const graph = require('../helpers/graph');

module.exports = async function (context, req) {
    context.log('delete-subscriptions function triggered');

    if (req.query.subscriptionId || (req.body && req.body.subscriptionId)) {
        subscriptionId = (req.query.subscriptionId || req.body.subscriptionId);

        await graph.deleteSubscription(subscriptionId)
            .then(() => {
                msg = `Deleted subscription with ID ${subscriptionId}`
                context.log(msg);
                context.res = {
                    body: msg
                }
            })
            .catch((err) => {
                context.log.error(err);
                context.res = {
                    body: `Error deleting subscription: ${JSON.stringify(err, null, 4)}`
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