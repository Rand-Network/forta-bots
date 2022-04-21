# Initial overhaul

## Agents
- [X] account-balance
- [X] address-watch
- [X] admin-events
	- L19 -> L72 is choppy, need to better understand invariants
	  to know if this is as simple as it can be
- [X] contract-variable-monitor
- [X] gnosis-safe-multisig
	- require L61 probably going to bork
- [X] governance
- [X] monitor-function-calls
- [X] new-contract-interaction
- [X] tornado-cash-monitor
	- require L6 may break
- [X] transaction-failure-count

## Refactor Suggestions
- [ ] Distill out CreateAlert into a top-level util?
- [X] Combine various utils into a single util file? (how similar are the utils?)

# Structural Cleanup

## Agents
- [X] account-balance
- [X] address-watch
- [X] admin-events
- [X] contract-variable-monitor
- [X] gnosis-safe-multisig
- [X] governance
- [X] monitor-function-calls
- [X] new-contract-interaction
- [X] tornado-cash-monitor
- [X] transaction-failure-count

# Test Cleanup

- [ ] account-balance
- [ ] address-watch
- [ ] admin-events
- [ ] contract-variable-monitor
- [ ] gnosis-safe-multisig
- [ ] governance
- [ ] monitor-function-calls
- [ ] new-contract-interaction
- [ ] tornado-cash-monitor
- [ ] transaction-failure-count
