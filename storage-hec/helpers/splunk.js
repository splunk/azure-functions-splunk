/*
Copyright 2022 Splunk Inc. 

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

const getHECPayload = async function(blobContent) {

    let denormalize = (process.env["DENORMALIZE_EVENTS"].toLowerCase() === 'true')
    let sourcetype = process.env["NSG_SOURCETYPE"]
    let payload = ''
    
    // https://learn.microsoft.com/azure/network-watcher/network-watcher-nsg-flow-logging-overview
    let records = blobContent.records

    records.forEach(function(record) {

        if (denormalize) {
            // Make each flow tuple its own distinct Splunk event
            for (i in record.properties.flows) {
                let flow = record.properties.flows[i]
    
                for (i in flow.flows) {
                    let ruleFlow = flow.flows[i]
    
                    for (i in ruleFlow.flowTuples) {
                        let ruleFlowTuple = ruleFlow.flowTuples[i]
                        
                        let splunkEvent = {}
                        splunkEvent["time"] = record.time
                        splunkEvent["systemId"] = record.systemId
                        splunkEvent["category"] = record.category
                        splunkEvent["resourceId"] = record.resourceId
                        splunkEvent["operationName"] = record.operationName
                        splunkEvent["version"] = record.properties.Version
                        splunkEvent["rule"] = flow.rule
                        splunkEvent["mac"] = ruleFlow.mac
                        splunkEvent["flowTuple"] = ruleFlowTuple
    
                        let recordEvent = {
                            "event": JSON.stringify(splunkEvent),
                            "sourcetype": sourcetype
                        }
                        let eventTimeStamp = getTimeStamp(record);
                        if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
                        payload += JSON.stringify(recordEvent);
                    }
                }
            }
        } else {
            // Make each record its own distince Splunk event
            let recordEvent = {
                "event": JSON.stringify(record),
                "sourcetype": sourcetype
            }
            let eventTimeStamp = getTimeStamp(record);
            if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
            payload += JSON.stringify(recordEvent);
        }
    })

    return payload
}

const sendToHEC = async function(blobContent) {

    let headers = {
        "Authorization": `Splunk ${process.env["SPLUNK_HEC_TOKEN"]}`
    }

    await getHECPayload(blobContent)
        .then(payload => {
            return axios.post(process.env["SPLUNK_HEC_URL"], payload, {headers: headers});
        })
        .catch(err => {
            throw err;
    });
}

exports.sendToHEC = sendToHEC;