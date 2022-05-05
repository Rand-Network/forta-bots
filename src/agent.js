const agentImports = [
  {name: 'account-balance',           agent: require('./account-balance/agent')},
  {name: 'address-watch',             agent: require('./address-watch/agent')},
  {name: 'admin-events',              agent: require('./admin-events/agent')},
  {name: 'contract-variable-monitor', agent: require('./contract-variable-monitor/agent')},
  {name: 'gnosis-safe-multisig',      agent: require('./gnosis-safe-multisig/agent')},
  {name: 'governance',                agent: require('./governance/agent')},
  {name: 'monitor-function-calls',    agent: require('./monitor-function-calls/agent')},
  {name: 'new-contract-interaction',  agent: require('./new-contract-interaction/agent')},
  {name: 'tornado-cash-monitor',      agent: require('./tornado-cash-monitor/agent')},
  {name: 'transaction-failure-count', agent: require('./transaction-failure-count/agent')}
];

let agentStates = [];
const agentMap = new Map();
const config = require('../agent-config.json');

async function generateAllAgents(_config) {
  let modProms = [];
  let modNames = [];
  for (let i = 0; i < agentImports.length; i++) {
    const imp = agentImports[i];
    modProms.push(imp.agent);
    modNames.push(imp.name);
  }

  await Promise.all(modProms).then((data) => {
    for (let i = 0; i < data.length; i++) {
      const module = data[i];
      const name = modNames[i];
      agentMap.set(name, module);
    }
  });

  let agentConfigs = [];
  for (let i = 0; i < _config.agents.length; i++) {
    const _agent = _config.agents[i];

    let agent = {..._agent};
    agent.developerAbbreviation = _config.developerAbbreviation;
    agent.protocolAbbreviation = _config.protocolAbbreviation;
    agent.protocolName = _config.protocolName;
    agentConfigs.push(agent);
  }

  return agentConfigs;
}

async function initialize() {
  const agentConfigs = await generateAllAgents(config);

  const agentStateProms = agentConfigs.map((agent) => {
    const agentMod = agentMap.get(agent.agentType);
    if (agentMod["initialize"] === undefined) {
      const agentState = {...agent};
      return new Promise(() => {agentState});
    }

    return agentMod.initialize(agent);
  });
  agentStates = await Promise.all(agentStateProms);
}

function handleAllTransactions(_agentMap, _agentStates) {
  return async function handleTransaction(txEvent) {
    const findProms = _agentStates.map((agent) => {
      const agentMod = _agentMap.get(agent.agentType);
      if (agentMod["handleTransaction"] === undefined) {
        return;
      }

      return agentMod.handleTransaction(agent, txEvent);
    });

    let findings = [];
    let findArrs = await Promise.all(findProms);
    for (let i = 0; i < findArrs.length; i++) {
      findings.push(...findArrs[i]);
    }

    return findings;
  }
}

function handleAllBlocks(_agentMap, _agentStates) {
  return async function handleBlock(blockEvent) {
    const findProms = _agentStates.map((agent) => {
      const agentMod = _agentMap.get(agent.agentType);
      if (agentMod["handleBlock"] === undefined) {
        return;
      }

      return agentMod.handleBlock(agent, blockEvent);
    });

    let findings = [];
    let findArrs = await Promise.all(findProms);
    for (let i = 0; i < findArrs.length; i++) {
      findings.push(...findArrs[i]);
    }

    return findings;
  }
}

module.exports = {
  initialize,
  agentImports,
  handleAllTransactions,
  handleTransaction: handleAllTransactions(agentMap, agentStates),
  handleAllBlocks,
  handleBlock: handleAllBlocks(agentMap, agentStates),
};
