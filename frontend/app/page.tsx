"use client"
import { Connection } from "@/lib/components/Connection";
import { WalletOptions } from "@/lib/components/WalletOptions";
import { useConnection, useWriteContract, useWatchContractEvent, useWaitForTransactionReceipt } from "wagmi";
import abi from "@/lib/QCOracleInterface.abi.json"
import { toHex, bytesToHex, hexToString, encodeFunctionData, webSocket, createPublicClient } from "viem"
import { useState } from "react";
import LoginButton from "@/lib/components/LoginButton";
import { useSendTransaction } from "@privy-io/react-auth";
import { ex1_qasm } from "@/lib/constants";
import { monadTestnet } from "wagmi/chains";

const client = createPublicClient({
  chain: monadTestnet,
  transport: webSocket("wss://testnet-rpc.monad.xyz")
})

export default function Home() {
  return <div className="min-h-screen w-full bg-black flex justify-center">
    <div className="w-1/2">
      <div className="flex my-4">
        <h1 className="text-white text-2xl font-bold">Monad Quantum Oracle</h1>
        <div className="ml-auto">
          <LoginButton />
        </div>
      </div>
      <HomePageTabs />
    </div>
  </div>
}

function HomePageTabs() {
  const [tab, setTab] = useState<"ex1" | "ex2" | "custom">("ex1")
  const [latestJobHash, setLatestJobHash] = useState<`0x${string}` | null>(null)
  const [latestResults, setLatestResults] = useState<{[x: string]: number}>({})
  const {sendTransaction} = useSendTransaction();

  return <div className="">
    <div className="my-16 bg-gray-900 flex">
      <div className=" w-full">
        {tab === "ex1" ? 
          <img src="/ex1.png" />: 
          <img src="" />}
      </div>
      <div className="min-w-64 flex flex-col items-center gap-2 justify-center">
        {Object.entries(latestResults).map(([key, value]) => <p>{key}: {value}</p>)}
        <button className="bg-green-700 p-4 rounded-md font-bold cursor-pointer" onClick={async () => {
          const randomBytes = crypto.getRandomValues(new Uint8Array(32));
          const randomHexValue = bytesToHex(randomBytes);
          setLatestJobHash(randomHexValue)

          const encodedData = encodeFunctionData({
            abi: abi,
            functionName: "requestJob",
            args: [randomHexValue, "0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A", BigInt(0), toHex(ex1_qasm)]
          })
          console.log("enc data", encodedData)

          client.watchContractEvent({
            address: "0x5EDE0c721141599408B945C90d3470977F60B3b9",
            abi,
            eventName: "JobCompleted",
            onLogs: (logs) => {
              const job_hash = (logs[0] as any)?.args?.jobHash
              console.log(job_hash, randomHexValue, job_hash === randomHexValue)
              if (job_hash === randomHexValue) {
                console.log("a")
                const args = (logs[0] as any).args
                console.log("b", args)
                const hex_value = hexToString(args.response)
                console.log("c", hex_value)
                const results = JSON.parse(hex_value)
                console.log("d")
                setLatestResults(results)
              }
            }
          })

          await sendTransaction({
            to: "0x5EDE0c721141599408B945C90d3470977F60B3b9",
            data: encodedData,
            value: BigInt(0),
            chainId: 10143
          })
          
        }}>
          Run
        </button>
      </div>
    </div>
    {/**
    <div className="flex gap-4">
      <button className={`${tab === 'ex1' ? 'bg-gray-900' : 'bg-gray-700'} p-4 cursor-pointer`} onClick={() => setTab("ex1")}>Example 1</button>
      <button className={`${tab === 'ex2' ? 'bg-gray-900' : 'bg-gray-700'} p-4 cursor-pointer`} onClick={() => setTab("ex2")}>Example 2</button>
      <button className={`${tab === 'custom' ? 'bg-gray-900' : 'bg-gray-700'} p-4 cursor-pointer`} onClick={() => setTab("custom")}>Custom Circuit</button>
    </div>*/}
  </div>
}

//export default function Home() {
//  const { isConnected } = useConnection()
//
//  return (
//    <div>
//      <ConnectWallet />
//      {isConnected && <App />}
//    </div>
//  );
//}

function ConnectWallet() {
  const { isConnected } = useConnection()
  if (isConnected) return <Connection />
  return <WalletOptions />
}

function App() {
  const { data: hash, writeContract } = useWriteContract()

  const code = "OPENQASM 2.0;\
include \"qelib1.inc\";\
\
qreg q[4];\
creg c[4];\
h q[0];\
h q[1];\
z q[1];\
cx q[0], q[1];\
ccx q[0], q[1], q[2];\
h q[2];\
cx q[2], q[3];\
measure q[3] -> c[3];"


  return <div>
    <button onClick={async () => {

      writeContract({
        abi,
        address: "0x5EDE0c721141599408B945C90d3470977F60B3b9",
        functionName: "requestJob",
        args: [randomHexValue, "0x72EdaCC7A4092Ed1AA0c1d1f9E7CE2b222B5075A", BigInt(0), toHex(code)],
      })

    }}>
      Send Transaction
    </button>
    {latestJobHash && <JobStatus hash={latestJobHash} />}
  </div>
}

function JobStatus({ hash }: { hash: `0x${string}`}) {
  useWatchContractEvent({
    address: "0x5EDE0c721141599408B945C90d3470977F60B3b9",
    abi,
    eventName: "JobCompleted",
    onLogs: (logs) => {
      if ((logs[0] as any)?.args?.jobHash === hash) {
        const args = (logs[0] as any).args
        const hex_value = hexToString(args.response)
        const results = JSON.parse(hex_value)
      }
    },
  })

  return <p>
    Watching for job completion for job ID: {hash}
  </p>
}
