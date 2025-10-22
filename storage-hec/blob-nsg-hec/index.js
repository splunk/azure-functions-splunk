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
const splunk = require('../helpers/splunk');
const process_nsg_flow = (process.env['PROCESS_NSG_FLOW'] === undefined || process.env['PROCESS_NSG_FLOW'].toLowerCase() === 'true')
module.exports = async function (context) {
    if(process_nsg_flow) {
        await splunk
                .sendToHEC(context.bindings.nsgBlobInput)
                .catch(err => {
                    context.log.error(`Error posting to Splunk HTTP Event Collector: ${err}`);

                    // If the event was not successfully sent to Splunk, drop the event in a storage blob container undeliverable-nsg-events
                    context.bindings.outputBlob = context.bindings.nsgBlobInput;
                })
    }
    else {
        context.log.warn("Skipping NSG flow logs since this functionality is disabled. In order to process NSG flow logs, either set the environment variable 'PROCESS_NSG_FLOW' to 'true' or remove it.")
    }
    context.done();
};