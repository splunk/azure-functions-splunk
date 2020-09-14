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

const auth = require('./auth');
const utils = require('./config');
const MicrosoftGraph = require('@microsoft/microsoft-graph-client');
require("isomorphic-fetch");

const graphClient = MicrosoftGraph.Client.init({
    authProvider: (done) => {
        done(null, auth.getAccessToken());
    }
});

const createSubscription = async function(subscriptionBody) {

    return await graphClient.api('/subscriptions')
        .post(subscriptionBody)
        .then((subscription) => {
            return subscription;
        })
        .catch ((err) => {
            throw err;
        });
}

const listSubscriptions = async function() {

    return await graphClient.api(`/subscriptions/`)
        .get()
        .catch((err) => {
            throw err;
        });
}

const updateSubscriptionExpiration = async function(subscriptionId, expirationDateTime) {

    return await graphClient.api(`/subscriptions/${subscriptionId}`)
        .update({
            "expirationDateTime" : expirationDateTime
        })
        .catch((err) => {
            throw err;
        });
}

const deleteSubscription = async function(subscriptionId) {

    return await graphClient.api(`/subscriptions/${subscriptionId}`)
        .delete()
        .catch((err) => {
            throw err;
        });
   
}

const getResource = async function(resource) {

    if (resource.startsWith("communications/callRecords")) {
        // We need to expand sessions and segments for call records
        return await graphClient.api(resource)
            .expand("sessions($expand=segments)")
            .get()
            .catch((err) => {
                throw err;
            });

    } else {
        return await graphClient.api(resource)
        .get()
        .catch((err) => {
            throw err;
        });
    }
}

const getResourceTime = function (resource) {

    if("lastModifiedDateTime" in resource) {
        return (new Date(resource.lastModifiedDateTime).getTime()) / 1000;
    } else {
        return (new Date().getTime()) / 1000;
    }
}

exports.deleteSubscription = deleteSubscription;
exports.createSubscription = createSubscription;
exports.updateSubscriptionExpiration = updateSubscriptionExpiration;
exports.listSubscriptions = listSubscriptions;
exports.getResource = getResource;
exports.getResourceTime = getResourceTime;