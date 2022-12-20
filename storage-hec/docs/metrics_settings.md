# Sending Metrics data to an Event Hub

## Create a common Metrics Event Hub
* From the Azure Portal, select Event Hubs
* Select your Event Hub Namespace
* Select Event Hubs
* Click the **+ Event Hub** button to create a new Event Hub
* Name the hub `insights-metrics-pt1m`
  * Note: `insights-metrics-pt1m` is the default for the functions, but a different name may be used.  If using a different event hub name, update the function application settings to reflect the correct event hub name.
* Set the number of partitions
  * Note: at least 4 partitions are recommended
* Click the **Create** button

## Use a Diagnostic Setting to Send Logs to the Event Hub
* From the Azure Portal, select the resource you want to enable for diagnostic log settings
* In the **Monitoring** section, select **Diagnostic settings**
* Choose an existing setting or create a new setting
* Give the diagnostic setting a name
* Select the events to log
* Select "Stream to an event hub"
* Select your event hub details
* ***Important:*** select the event hub created in the step above (`insights-metrics-pt1m` by default) 
* Click the Save button