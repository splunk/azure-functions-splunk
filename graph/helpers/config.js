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