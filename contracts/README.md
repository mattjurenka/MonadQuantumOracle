# QC Oracle Interface Contracts

To deploy: `forge create ./src/QCOracleInterface.sol:QCOracleInterface --rpc-url $MONAD_TESTNET_RPC  --account deployer --broadcast`

To output abis: `forge compile --extra-output-files abi`

To Verify: `forge verify-contract <DEPLOYED_ADDRESS> ./src/QCOracleInterface.sol:QCOracleInterface --chain 10143 --watch`