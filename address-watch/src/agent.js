const { Finding, FindingSeverity, FindingType } = require('forta-agent');

// load config file
const config = require('../agent-config.json');

// load configuration data from agent config file
const {
  developerAbbreviation: developerAbbrev,
  protocolName,
  protocolAbbrev,
  contracts,
} = config;

// get list of addresses to watch
const addresses = Object.values(contracts);
if (addresses.length === 0) {
  throw new Error('Must supply at least one address to watch');
}

function createAlert(name, address, contractName, abbrev, type, severity) {
  return Finding.fromObject({
    name: `${name} Address Watch`,
    description: `Address ${address} (${contractName}) was involved in a transaction`,
    alertId: `${developerAbbrev}-${abbrev}-ADDRESS-WATCH`,
    type: FindingType[type],
    severity: FindingSeverity[severity],
  });
}

async function handleTransaction(txEvent) {
  const findings = [];
  const txAddrs = Object.keys(txEvent.addresses).map((address) => address.toLowerCase());

  // check if an address in the watchlist was the initiator of the transaction
  addresses.forEach((address, index) => {
    if (txAddrs.includes(address.address.toLowerCase())) {
      const params = Object.values(contracts)[index];
      // eslint-disable-next-line max-len
      findings.push(createAlert(protocolName, address.address, params.name, protocolAbbrev, params.watch.type, params.watch.severity));
    }
  });

  return findings;
}

module.exports = {
  handleTransaction,
};
