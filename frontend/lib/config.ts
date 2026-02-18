import { createConfig} from "@privy-io/wagmi"
import { http } from "wagmi"
import { monadTestnet } from "viem/chains"

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http()
  },
})