const graph = require('../helpers/graph');

module.exports = async function (context, req) {
    context.log('get-subscriptions function triggered');

    await graph.listSubscriptions()
        .then((subscriptions) => {
            context.res = {
                body: JSON.stringify(subscriptions, null, 4)
            };
        })
        .catch((err) => {
            msg = `Error getting subscriptions: ${JSON.stringify(err, null, 4)}`
            context.log.err(msg);
            context.res = {
                body: msg
            }
        });
};