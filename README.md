# Azure Functions for Splunk

This repository contains available [Azure Functions]( https://azure.microsoft.com/en-us/services/functions/) to integrate Microsoft data with Splunk.  Azure Functions can be triggered by certain events like an event arriving on an Event Hub, a blob written to a storage account, a Microsoft Teams call concluding, etc.  The functions in this repository respond to these events and route data to Splunk accordingly.

## Getting Started

Each available set of functions in this repository is contained within its own folder.  For example, the Microsoft Graph functions are contained in the graph folder.  To deploy the functions to your Azure environment, click the Deploy to Azure button located in the README.md in the corresponding function folder.

## Available Functions

| Functions | Location | Description |
| --------- | -------- | ----------- |
| Microsoft Teams | [graph](https://github.com/splunk/azure-functions-splunk/tree/master/graph) | Collects [Microsoft Teams call records]( https://docs.microsoft.com/en-us/graph/api/resources/callrecords-callrecord).  This data can be used with the [Microsoft 365 App for Splunk]( https://splunkbase.splunk.com/app/3786/) and/or the [RWI – Executive Dashboard]( https://splunkbase.splunk.com/app/4952/) |


## Support

This software is released as-is. Splunk provides no warranty and no support on this software. If you have any issues with the software, please file an issue on the repository.
