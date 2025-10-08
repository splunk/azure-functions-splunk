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
    let convert_tuple_to_json = (process.env["CONVERT_TUPLE_TO_JSON"] === undefined || process.env["CONVERT_TUPLE_TO_JSON"].toLowerCase() === 'true')
    let sourcetype = process.env["NSG_SOURCETYPE"]
    let vnet_sourcetype = process.env["VNET_SOURCETYPE"]
    let payload = ''
    
    // NSG flow logs
    // https://learn.microsoft.com/azure/network-watcher/network-watcher-nsg-flow-logging-overview

    // VNet flow logs
    // https://learn.microsoft.com/en-us/azure/network-watcher/vnet-flow-logs-overview
    let records = blobContent.records

    records.forEach(function(record) {
        
        const is_vnetflow = (record.category == 'FlowLogFlowEvent')

        if (denormalize) {
            if(!is_vnetflow) {
                // NSG flow
                // Make each flow tuple its own distinct Splunk event
                for (i in record.properties.flows) {
                    let flow = record.properties.flows[i]
        
                    for (i in flow.flows) {
                        let ruleFlow = flow.flows[i]
        
                        for (i in ruleFlow.flowTuples) {
                            let ruleFlowTuple = ruleFlow.flowTuples[i]
                            
                            let splunkEvent = {}
                            if(convert_tuple_to_json) {
                                let flowTuple = flowGroup.flowTuples[i].split(',')
                                splunkEvent["time"] = Number(flowTuple[0])
                                splunkEvent["sourceAddress"] = flowTuple[1]
                                splunkEvent["destinationAddress"] = flowTuple[2]
                                splunkEvent["sourcePort"] = flowTuple[3]
                                splunkEvent["destinationPort"] = flowTuple[4]
                                splunkEvent["protocol"] = flowTuple[5]
                                splunkEvent["deviceDirection"] = flowTuple[6]
                                splunkEvent["deviceAction"] = flowTuple[7]
                                if(Number(record.properties.Version) == 2) {
                                    splunkEvent["flowState"] = flowTuple[8]
                                    if(flowTuple[9] != '') {
                                        splunkEvent["packetsStoD"] = Number(flowTuple[9])
                                    } 
                                    if(flowTuple[10] != '') {
                                        splunkEvent["bytesStoD"] = Number(flowTuple[10])
                                    } 
                                    if(flowTuple[11] != '') {
                                        splunkEvent["packetsDtoS"] = Number(flowTuple[11])
                                    } 
                                    if(flowTuple[12] != '') {
                                        splunkEvent["bytesDtoS"] = Number(flowTuple[12])
                                    }
                                }

                            }
                            else {
                                let flowTuple = flowGroup.flowTuples[i]
                                // Extracting the epoch from the tuple since it's when the traffic occurred, 
                                //  whereas the value in the "time" attribute of the record is when it was logged.
                                splunkEvent["time"] = Number(flowTuple.substr(0, flowTuple.indexOf(',')))
                                splunkEvent["flowTuple"] = flowTuple
                            }
                            splunkEvent["systemId"] = record.systemId
                            splunkEvent["category"] = record.category
                            splunkEvent["resourceId"] = record.resourceId
                            splunkEvent["operationName"] = record.operationName
                            splunkEvent["version"] = record.properties.Version
                            splunkEvent["rule"] = flow.rule
                            splunkEvent["mac"] = ruleFlow.mac
        
                            let recordEvent = {
                                "event": JSON.stringify(splunkEvent),
                                "sourcetype": sourcetype
                            }
                            // Prioritize the tuple's timestamp over the flow record's
                            let eventTimeStamp = splunkEvent['time'] || getTimeStamp(record);
                            if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
                            payload += JSON.stringify(recordEvent);
                        }
                    }
                }
            }
            else {
                // Vnet flow
                for (i in record.flowRecords.flows) {
                    let flow = record.flowRecords.flows[i];

                    for (i in flow.flowGroups) {
                        let flowGroup = flow.flowGroups[i];
                        
                        for (i in flowGroup.flowTuples) {
                            let splunkEvent = {}

                            if(convert_tuple_to_json) {
                                let flowTuple = flowGroup.flowTuples[i].split(',')
                                splunkEvent["time"] = Number(flowTuple[0])
                                splunkEvent["sourceAddress"] = flowTuple[1]
                                splunkEvent["destinationAddress"] = flowTuple[2]
                                splunkEvent["sourcePort"] = flowTuple[3]
                                splunkEvent["destinationPort"] = flowTuple[4]
                                splunkEvent["protocol"] = flowTuple[5]
                                splunkEvent["deviceDirection"] = flowTuple[6]
                                splunkEvent["flowState"] = flowTuple[7]
                                splunkEvent["encryption"] = flowTuple[8]                                
                                if(flowTuple[9] != '') {
                                    splunkEvent["packetsStoD"] = Number(flowTuple[9])
                                } 
                                if(flowTuple[10] != '') {
                                    splunkEvent["bytesStoD"] = Number(flowTuple[10])
                                } 
                                if(flowTuple[11] != '') {
                                    splunkEvent["packetsDtoS"] = Number(flowTuple[11])
                                } 
                                if(flowTuple[12] != '') {
                                    splunkEvent["bytesDtoS"] = Number(flowTuple[12])
                                }
                            }
                            else {
                                let flowTuple = flowGroup.flowTuples[i]
                                // Extracting the epoch from the tuple since it's when the traffic occurred, 
                                //  whereas the value in the "time" attribute of the record is when it was logged.
                                splunkEvent["time"] = Number(flowTuple.substr(0, flowTuple.indexOf(',')))
                                splunkEvent["flowTuple"] = flowTuple
                            }
                            splunkEvent["flowLogVersion"] = record.flowLogVersion
                            splunkEvent["flowLogGUID"] = record.flowLogGUID
                            splunkEvent["mac"] = record.macAddress
                            splunkEvent["flowLogResourceID"] = record.flowLogResourceID
                            splunkEvent["targetResourceID"] = record.targetResourceID
                            splunkEvent["operationName"] = record.operationName
                            splunkEvent["aclID"] = flow.aclID
                            splunkEvent["rule"] = flowGroup.rule
                            
                            let recordEvent = {
                                "event": JSON.stringify(splunkEvent),
                                "sourcetype": vnet_sourcetype
                            }
                            // Prioritize the tuple's timestamp over the flow record's
                            let eventTimeStamp = splunkEvent['time'] || getTimeStamp(record);
                            if(eventTimeStamp) { recordEvent["time"] = eventTimeStamp; }
                            payload += JSON.stringify(recordEvent);

                        }
                    }
                }
            }


        } else {
            // Make each record its own distinct Splunk event
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