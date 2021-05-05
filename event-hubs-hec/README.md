# Azure Functions for Sending Event Hub data to a Splunk HTTP Event Collector
Events arriving on an Azure Event Hub can trigger serverless Azure Functions.  Azure Functions can further process the raw events in near real-time.

<a href="https://portal.azure.com/#blade/Microsoft_Azure_CreateUIDef/CustomDeploymentBlade/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fsplunk%2Fazure-functions-splunk%2Fmaster%2Fevent-hubs-hec%2Fdeploy%2FazureDeploy.json/createUIDefinitionUri/https%3A%2F%2Fraw.githubusercontent.com%2Fsplunk%2Fazure-functions-splunk%2Fmaster%2Fevent-hubs-hec%2Fdeploy%2FazureDeploy.portal.json" target="_blank">
<img src="https://aka.ms/deploytoazurebutton"/>
</a>

This repository contains a collection of Azure Functions for:
* Processing events as they arrive on an Event Hub
* Separating batched events (events in a `records[]` array) into individual events
* Formatting events in the `event` format for a Splunk HTTP Event Collector
* Sending event data to Splunk via [HTTP Event Collector](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector)
* Writing event data to a Storage Blob if data cannot successfully be sent to Splunk
  * The [Splunk Add-on for Microsoft Cloud Services](https://splunkbase.splunk.com/app/3110/) can be utilized to retrieve Storage Blob data

## Getting Started

### 1. Create an HTTP Event Collector token in your Spunk Environment
An HTTP Event Collector receives data pushed from the Azure Functions.  Refer to the Splunk documentation for [setting up an HTTP Event Collector input](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector) in your Splunk Enterprise or Splunk Cloud environment.

### 2. Create an Event Hub Namespace
An Event Hub Namespace will contain one or more Event Hubs.  Refer to the Microsoft documentation for [Event Hub Namespace setup instructions](https://docs.microsoft.com/en-us/azure/event-hubs/event-hubs-create).

### 3. Send data to an Event Hub
Microsoft Azure uses [diagnostics settings](https://docs.microsoft.com/en-us/azure/azure-monitor/essentials/diagnostic-settings) to define data export and destination rules.  Each resource to be monitored must have a diagnostic setting.  Diagnostic settings can be defined using the Azure portal, PowerShell, [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/monitor/diagnostic-settings?view=azure-cli-latest), [Resource Manager templates](https://docs.microsoft.com/en-us/azure/azure-monitor/essentials/resource-manager-diagnostic-settings), REST API, or an Azure Policy.
* [Sending Azure Activity log data to an Event Hub using the Azure Portal walkthrough](docs/activity_log_diagnostic_settings.md)
* [Sending Azure Active Directory logs to an Event Hub](docs/azure_ad_diagnostic_settings.md)
* [Sending Azure Diagnostic logs to an Event Hub](docs/diagnostic_logs_settings.md)
* [Sending Azure Metrics to an Event Hub](docs/metrics_settings.md)

* Sending Azure Virtual Machine data to an Event Hub
  * [Windows VMs](https://docs.microsoft.com/en-us/azure/virtual-machines/extensions/diagnostics-windows)
  * [Linux VMs](https://docs.microsoft.com/en-us/azure/virtual-machines/extensions/diagnostics-linux)


### 4. Deploy the functions to Azure

Use the "Deploy to Azure" button above to deploy the Azure Functions from this repo to your Azure account.  During setup, you will be prompted for the following information:

* Event Hub Namespace
* Event Hub consumer group for each hub monitored
* Splunk sourcetype or sourcetype base for each hub monitored
  * Note: see section below about sourcetypes
* Splunk [HTTP Event Collector](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector) Endpoint
* Splunk [HTTP Event Collector](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector) Token

## Splunk Sourcetypes
### Azure Active Directory Sourcetypes
Functions that collect Azure Active Directory data use a sourcetype base.  The category of the Azure Active Directory event is appended to the sourcetype base to construct the full sourcetype.

**Example**

The default sourcetype base for Azure Active Directory Sign-in and Audit events is `azure:aad`

A sign-in event with a category of `SignInLogs` will have a sourcetype of `azure:aad:signinlogs`

An audit event with a category of `AuditLogs` will have a sourcetype of `azure:aad:auditlogs`

### Diagnostic Logs
Functions that collect diagnostic log data attempt to construct a sourcetype based on the `resourceId` of the event.  The logic for this sourcetype construction can be found in the `getSourceType` function in the [./helpers/splunk.js file](helpers/splunk.js).  The following steps are used to construct the sourcetype:

* A regular expression is used to extract two groups after the text `/PROVIDERS`
  * Example `/PROVIDERS/`**`MICROSOFT.RESOURCES/DEPLOYMENTS/`**
* Periods (`.`) and forward slashes (`/`) are replaced with colons (`:`)
* The event category is appended

**Example**

An event with a `resourceId` of `/SUBSCRIPTIONS/subscription ID/RESOURCEGROUPS/group/PROVIDERS/MICROSOFT.RESOURCES/DEPLOYMENTS/FAILURE-ANOMALIES-ALERT-RULE-DEPLOYMENT-12345678` will have a sourcetype of `azure:resources:deployments:administrative`

If a sourcetype cannot be constructed from the event, the specified default sourcetype entered at setup will be used.


## Securing Azure Function settings
Microsoft stores the above values as [application settings](https://docs.microsoft.com/en-us/azure/azure-functions/functions-how-to-use-azure-function-app-settings#settings). These settings are stored encrypted, but you may opt to transfer one or more of these settings to a Key Vault. Refer to the following documentation for details on this procedure:

* [Use Key Vault references for App Service and Azure Functions](https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)


## Support
This software is released as-is. Splunk provides no warranty and no support on this software. If you have any issues with the software, please file an issue on the repository.