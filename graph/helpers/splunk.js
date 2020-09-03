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