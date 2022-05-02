const BigNumber = require('bignumber.js');
const {
  Finding, FindingSeverity, FindingType, ethers, getEthersProvider,
} = require('forta-agent');

const utils = require('../utils');

// helper function to create alerts
function createAlert(
  variableName,
  contractName,
  contractAddress,
  type,
  severity,
  protocolName,
  protocolAbbreviation,
  developerAbbreviation,
  thresholdPosition,
  thresholdPercentLimit,
  actualPercentChange,
) {
  return Finding.fromObject({
    name: `${protocolName} Contract Variable`,
    description: `The ${variableName} variable value in the ${contractName} contract had a change`
      + ` in value over the ${thresholdPosition} threshold limit of ${thresholdPercentLimit}`
      + ' percent',
    alertId: `${developerAbbreviation}-${protocolAbbreviation}-CONTRACT-VARIABLE`,
    type: FindingType[type],
    severity: FindingSeverity[severity],
    protocol: protocolName,
    metadata: {
      contractName,
      contractAddress,
      variableName,
      thresholdPosition,
      thresholdPercentLimit: thresholdPercentLimit.toString(),
      actualPercentChange,
    },
  });
}

const validateConfig = (config) => {
  let ok = false;
  let errMsg = "";

  if (config["developerAbbreviation"] === undefined) {
      errMsg = `No developerAbbreviation found`;
      return { ok, errMsg };
  }
  if (config["protocolName"] === undefined) {
      errMsg = `No protocolName found`;
      return { ok, errMsg };
  }
  if (config["protocolAbbreviation"] === undefined) {
      errMsg = `No protocolAbbreviation found`;
      return { ok, errMsg };
  }

  for (const [name, entry] of Object.entries(config.contracts)) {
    if (entry.address === undefined) {
      errMsg = `No address found in configuration file for '${name}'`;
      return { ok, errMsg };
    }

    if (entry.abiFile === undefined) {
      errMsg = `No ABI file found in configuration file for '${name}'`;
      return { ok, errMsg };
    }
  }

  ok = true;
  return { ok, errMsg };
};

const initialize = async (config) => {
  let agentState = {...config};

  const { ok, errMsg } = validateConfig(config);
  if (!ok) {
    throw new Error(errMsg);
  }

  agentState.variableInfoList = [];

  const provider = getEthersProvider();

  // load the contract addresses, abis, and generate an ethers contract for each contract name
  // listed in the config
  const contractList = Object.entries(config.contracts).map(([name, entry]) => {
    const abi = utils.getAbi(config.name, entry.abiFile);
    const contract = new ethers.Contract(entry.address, abi, provider);
    return { name, contract, };
  });

  contractList.forEach((contractEntry) => {
    const entry = config.contracts[contractEntry.name];
    const { info } = utils.getVariableInfo(entry, contractEntry);
    agentState.variableInfoList.push(...info);
  });

  return agentState;
};

const handleBlock = async (agentState, blockEvent) => {
  // for each item present in variableInfoList, attempt to invoke the getter method
  // corresponding to the item's name and make sure it is within the specified threshold percent
  const variablePromises = agentState.variableInfoList.map(async (variableInfo) => {
    const variableFindings = [];
    const {
      name: variableName,
      type,
      severity,
      contractInfo,
      upperThresholdPercent,
      lowerThresholdPercent,
      minNumElements,
      pastValues,
    } = variableInfo;
    const { name: contractName, contract } = contractInfo;

    let newValue = await contract[variableName]();
    newValue = new BigNumber(newValue.toString());
    const averageBN = pastValues.getAverage();

    // check the current number of elements in the pastValues array
    if (pastValues.getNumElements() >= minNumElements) {
      // only check for an upperThresholdPercent change if upperThresholdPercent exists and the
      // new value is greater than the current average
      if (upperThresholdPercent !== undefined && newValue.gt(averageBN)) {
        const percentOver = utils.checkThreshold(upperThresholdPercent, newValue, pastValues);
        if (percentOver !== undefined) {
          variableFindings.push(createAlert(
            variableName,
            contractName,
            contract.address,
            type,
            severity,
            agentState.protocolName,
            agentState.protocolAbbreviation,
            agentState.developerAbbreviation,
            'upper',
            upperThresholdPercent,
            percentOver.toString(),
          ));
        }
      }

      // only check for a lowerThresholdPercent change if lowerThresholdPercent exists and the
      // new value is less than the current average
      if (lowerThresholdPercent !== undefined && newValue.lt(averageBN)) {
        const percentOver = utils.checkThreshold(lowerThresholdPercent, newValue, pastValues);
        if (percentOver !== undefined) {
          variableFindings.push(createAlert(
            variableName,
            contractName,
            contract.address,
            type,
            severity,
            agentState.protocolName,
            agentState.protocolAbbreviation,
            agentState.developerAbbreviation,
            'lower',
            lowerThresholdPercent,
            percentOver.toString(),
          ));
        }
      }
    }

    // add the value received in this iteration to the pastValues array
    pastValues.addElement(newValue);
    return variableFindings;
  });

  const findings = (await Promise.all(variablePromises)).flat();
  return findings;
};

module.exports = {
  validateConfig,
  initialize,
  handleBlock,
  createAlert,
};
