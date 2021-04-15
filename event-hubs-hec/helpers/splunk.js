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

const getEpochTime = function(timeString) {
    try {
        let epochTime = new Date(timeString).getTime();
        return epochTime;
    } catch {
        return null;
    }
}

const getTimeStamp = function(message) {
    if(message.hasOwnProperty('time')) {
        return getEpochTime(message["time"]);
    }
    return null;
}

const getHECPayload = async function(message, sourcetype) {
    try {
        jsonMessage = JSON.parse(message);
    } catch (err) {
        // The message is not JSON, so send it as-is.
        let payload = {
            "sourcetype": sourcetype,
            "event": message
        }
        return payload
    }

    // If the JSON contains a records[] array, batch the events for HEC.
    if(jsonMessage.hasOwnProperty('records')) {
        let payload = ''
        jsonMessage.records.forEach(function(record) {
            recordEvent = {
                "sourcetype": sourcetype,
                "event": JSON.stringify(record)
            }
            let eventTimeStamp = getTimeStamp(record);
            if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
            payload += JSON.stringify(recordEvent);
        });
        return payload
    }

    // If we made it here, the JSON does not contain a records[] array, so send the data as-is
    let payload = {
        "sourcetype": sourcetype,
        "event": JSON.stringify(jsonMessage)
    }
    let eventTimeStamp = getTimeStamp(jsonMessage);
    if(eventTimeStamp) { payload["time"] = eventTimeStamp; }
    return payload
}

const sendToHEC = async function(message, sourcetype) {

    let headers = {
        "Authorization": `Splunk ${process.env["SPLUNK_HEC_TOKEN"]}`
    }

    await getHECPayload(message, sourcetype)
    .then(payload => {
        return axios.post(process.env["SPLUNK_HEC_URL"], payload, {headers: headers});
    })
    .catch(err => {
        throw err;
    });
}

exports.sendToHEC = sendToHEC;