const graph = require('../helpers/graph');
const splunk = require('../helpers/splunk');

module.exports = async function (context, notificationQueueItem) {
    context.log('Queue trigger function processed work item', JSON.stringify(notificationQueueItem));

    let sourcetype = splunk.getSourcetype(notificationQueueItem);
    await graph.getResource(notificationQueueItem)
        .then((resource) => {
            let payload = {
                "event": JSON.stringify(resource),
                "sourcetype": sourcetype,
                "time": graph.getResourceTime(resource)
            }
            return payload;
        })
        .then((payload) => {
            splunk.sendToHEC(payload)
            .catch((err) => {
                context.log.error(`Error posting to Splunk HTTP Event Collector: ${err}`);
                return err;
            });
        })
        .catch((err) => {
            context.log.error(`Error: ${JSON.stringify(err, null, 4)}`);
            throw err;
        });
};