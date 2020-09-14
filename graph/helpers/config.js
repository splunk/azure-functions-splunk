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

const checkConfig = function () {
  let tenantId = process.env["TENANT_ID"];
  let clientId = process.env["CLIENT_ID"];
  let clientSecret = process.env["CLIENT_SECRET"];
  let splunkHecUrl = process.env["SPLUNK_HEC_URL"];
  let splunkHecToken = process.env["SPLUNK_HEC_TOKEN"];

  if (!tenantId || !clientId || !clientSecret || !splunkHecUrl || !splunkHecToken) {
    return false;
  }

  return true;
}

exports.checkConfig = checkConfig;