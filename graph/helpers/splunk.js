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

const axios = require('axios');
const sourcetypes = require('../helpers/sourcetypes.json');

const RESOURCE_REGEX = /^(?<resourceType>[^\/]*\/[^\/]*)/
// RESOURCE_REGEX matches everything up to the second instance of '/'
// Example: 
//    if the resource is communications/callRecords/123456
//    then the extration will be communications/callRecords

const getSourcetype = function(resource) {

    let resourceType = "unknown";
    if(RESOURCE_REGEX.test(resource)) {
        resourceType = resource.match(RESOURCE_REGEX).groups['resourceType'];
    }
    
    let sourcetype = sourcetypes[resourceType];

    if(sourcetype) {
        return sourcetype;
    } else {
        return "m365:unknown"
    }

}

const logInfo = async function(message) {
    let payload = {
        "event": message,
        "sourcetype": "m365:log:info"
    }

    sendToHEC(payload)
        .catch((err) => {
            return err;
        });
}

const logError = async function(message) {
    let payload = {
        "event": message,
        "sourcetype": "m365:log:error"
    }

    sendToHEC(payload)
        .catch((err) => {
            return err;
        });
}

const logWarning = async function(message) {
    let payload = {
        "event": message,
        "sourcetype": "m365:log:warn"
    }

    sendToHEC(payload)
        .catch((err) => {
            return err;
        });
}

const sendToHEC = async function(payload) {

    let headers = {
        "Authorization": `Splunk ${process.env["SPLUNK_HEC_TOKEN"]}`
    }

    return await axios.post(process.env["SPLUNK_HEC_URL"], payload, {headers: headers})
        .catch((err) => {
            context.log.error(`Error posting to Splunk HTTP Event Collector: ${err}`);
            return err;
        });

}

exports.getSourcetype = getSourcetype;
exports.sendToHEC = sendToHEC;
exports.logInfo = logInfo;
exports.logError = logError;
exports.logWarning = logWarning;