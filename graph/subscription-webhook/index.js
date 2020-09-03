const utils = require('../helpers/config');

module.exports = async function (context, req) {
    context.log('Received HTTP request on the subscription-webhook.');

    // Make sure we have values for the application
    if (!utils.checkConfig()) {
        context.res = {
            status: 500,
            body: "Please check Function App parameters. One or more required parameters are missing values."
        };
        return;
    }

    if (req.query.validationToken) {
        // The first time this webhook is called from a Graph subscription, a validationToken will be sent to verify this is a legit webhook to receive data.
        // We just need to respond back with the validationToken.
        context.log('Received request to validate subscription webhook: ' + req.query.validationToken);
        context.res = {
            body: req.query.validationToken
        };
    }
    else {
        // Graph is sending us some data!
        context.log('Received a subscription notification.');

        for (let i = 0; i < req.body.value.length; i++) {
            context.bindings.notificationQueue = req.body.value[i].resource;           
        }

        // Send a status of 'Accepted'
        context.res.status = 202;
    }
};