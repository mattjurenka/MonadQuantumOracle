from web3 import AsyncWeb3, WebSocketProvider
from web3.utils.subscriptions import LogsSubscription

import asyncio
import json

from qiskit import qasm2, transpile
from qiskit_aer import AerSimulator

with open("./src/QCOracleInterface.abi.json", 'r') as file:
    data = json.load(file)

address = '0x5EDE0c721141599408B945C90d3470977F60B3b9'
ws_url = "wss://testnet-rpc.monad.xyz"

simulator = AerSimulator()

async def main():
    async with AsyncWeb3(WebSocketProvider(ws_url)) as w3:
        contract = w3.eth.contract(address=address, abi=data)

        print("Updating Provider Info...")
        trx = await contract.functions.updateProviderInfo(0, [0]).build_transaction({
            'from': '0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A',
            'gas': 100000,
            'nonce': await w3.eth.get_transaction_count('0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A'),
        })
        signed_trx = w3.eth.account.sign_transaction(trx, private_key="0x80c449c62a358aba11301c3fc5ad387eca72a42eb6ae4c342c128e0ffb247e34")

        await w3.eth.send_raw_transaction(signed_trx.raw_transaction)

        print("Subscribing to events...")
        request_event = contract.events.JobRequested()
        await w3.subscription_manager.subscribe([
            LogsSubscription(
                label="JobRequested",
                address=w3.to_checksum_address(address),
                topics=[request_event.topic],
                handler=handle_job_requested,
                handler_context={"request_event": request_event}
            )
        ])

        await w3.subscription_manager.handle_subscriptions()

async def handle_job_requested(handler_context):
    log_receipt = handler_context.result

    event_data = handler_context.request_event.process_log(log_receipt)

    jobHash = event_data.args.jobHash.hex()
    code = event_data.args.data.decode("utf-8")

    print(f"Received JobRequested event: {jobHash}")

    circuit = qasm2.loads(code)
    print(circuit)
    compiled = transpile(circuit, backend=simulator)

    result = simulator.run(compiled).result()
    counts = result.get_counts()
    print(f"Job result: {counts}")

    print("Sending JobCompleted event...")
    async with AsyncWeb3(WebSocketProvider(ws_url)) as w3:
        contract = w3.eth.contract(address=address, abi=data)

        trx = await contract.functions.respondToJob("0x" + jobHash, "0x" + json.dumps(counts).encode("utf-8").hex()).build_transaction({
            'from': '0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A',
            'gas': 1000000,
            'nonce': await w3.eth.get_transaction_count('0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A'),
        })
        signed_trx = w3.eth.account.sign_transaction(trx, private_key="0x80c449c62a358aba11301c3fc5ad387eca72a42eb6ae4c342c128e0ffb247e34")

        await w3.eth.send_raw_transaction(signed_trx.raw_transaction)

if __name__ == "__main__":
    asyncio.run(main())
