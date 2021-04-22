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

const utils = require('../helpers/config');
const splunk = require('../helpers/splunk');

module.exports = async function (context, req) {
    let msg = '[subscription-webhook] received HTTP request on the subscription-webhook.';
    context.log(msg);
    splunk.logInfo(msg);

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
        let msg = '[subscription-webhook] received request to validate subscription webhook: ' + req.query.validationToken;
        context.log(msg);
        splunk.logInfo(msg);
        context.res = {
            body: req.query.validationToken
        };
    }
    else {
        // Graph is sending us some data!
        msg = '[subscription-webhook] received a subscription notification: ' + JSON.stringify(req.body);
        context.log(msg);
        splunk.logInfo(msg);
        try {
            splunk.logInfo(msg);
            for (let i = 0; i < req.body.value.length; i++) {
                context.bindings.notificationQueue = req.body.value[i].resource;           
            }
            // Send a status of 'Accepted'
            context.res.status = 202;
        } catch(err) {
            context.log(err.message);
            context.res.status = 500;
        }
    }
};
