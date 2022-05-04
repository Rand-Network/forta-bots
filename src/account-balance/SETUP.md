# Account Balance Agent Template

This agent monitors the account balances (in Ether) of addresses on the blockchain and creates an alert when
the balance falls below a specified threshold value. Threshold, alert type, and alert severity are specified
per address.  An existing agent of this type may be modified to add/remove/update addresses in the agent
configuration file.

## Agent Setup Walkthrough

1. `accountBalance` (required) - The Object value for this key corresponds to addresses for which we want to monitor
the account balance.  Each key in the Object is a name that we can specify, where that name is simply a string that
we use as a label when referring to the address (the string can be any valid string that we choose, it will not
affect the monitoring by the agent).  The Object corresponding to each name requires an address key/value pair, a
thresholdEth key and integer value, and an alert key with an Object value that specifies the type and severity of
the alert.  For example, to monitor the Uni contract Ether balance, we would need the address, the threshold value,
and a type and severity for the alert (must be valid type and severity from Forta SDK):

```
  "accountBalance": {
    "Uni": {
      "address": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      "thresholdEth": 3,
      "alert": { "type": "Suspicious", "severity": "High" }
    }
  }
```

Note that any unused entries in the configuration file must be deleted for the agent to work.  The original version
of the configuration file contains several placeholders to show the structure of the file, but these are not valid
entries for running the agent.

2. `alertMinimumIntervalSeconds` (required) - Type in the minimum number of seconds between sending alerts.  This
value is necessary to avoid sending too many alerts for the same condition in each block.  The default behavior
is for the agent to emit an alert when the condition is met, keep a counter of how many alerts would have happened
within the interval specified, then emit an alert once that interval has been exceeded.  The subsequent emitted
alert will contain the number of alerts that would have occurred during that interval.