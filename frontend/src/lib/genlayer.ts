import { createClient } from "genlayer-js"
import { studionet } from "genlayer-js/chains"
import { CONTRACT_ADDRESS, CHAIN_ID_HEX } from "./constants"

// One-time diagnostic — verify what chainId genlayer-js considers Studio.
console.log("[Credence] genlayer-js studionet on load:", {
  id: (studionet as any)?.id,
  name: (studionet as any)?.name,
  rpcUrls: (studionet as any)?.rpcUrls,
  ourCHAIN_ID_HEX: CHAIN_ID_HEX,
  ourCHAIN_ID_HEX_decimal: parseInt(CHAIN_ID_HEX, 16),
})

export const client = createClient({ chain: studionet })

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function asJsonRpcAccount(addr: string) {
  return { address: addr as `0x${string}`, type: "json-rpc" as const }
}

async function ensureChain(): Promise<void> {
  const eth = (window as any).ethereum
  if (!eth) throw new Error("MetaMask not detected.")

  const currentChainId = await eth.request({ method: "eth_chainId" })
  if (
    typeof currentChainId === "string" &&
    currentChainId.toLowerCase() === CHAIN_ID_HEX.toLowerCase()
  ) {
    return
  }

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    })
  } catch (e: any) {
    if (e?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "GenLayer Studio",
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: ["https://studio.genlayer.com/api"],
            blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
          },
        ],
      })
    } else {
      throw new Error(
        `Failed to switch MetaMask to Studio Network (chainId ${CHAIN_ID_HEX}). ${e?.message || ""}`,
      )
    }
  }
}

/**
 * Submit an analysis. Captures submitter address & timestamp client-side
 * & passes them as args (the gl.message.sender_address / gl.block.timestamp
 * route triggers the silent storage rollback bug in write methods).
 *
 * viem 2.x requires account as a JsonRpcAccount object, not a plain string —
 * the brief's rule is overridden here based on runtime evidence.
 */
export async function submitAnalysis(
  analysisType: string,
  primaryInput: string,
  domainOrType: string,
  secondaryInput: string,
  submitterAddress: string,
  accountAddress: string,
) {
  if (!ADDRESS_REGEX.test(submitterAddress)) {
    throw new Error(
      `Invalid submitter address: "${submitterAddress}". Please reconnect your wallet & try again.`,
    )
  }
  if (!ADDRESS_REGEX.test(accountAddress)) {
    throw new Error(
      `Invalid account address: "${accountAddress}". Please reconnect your wallet & try again.`,
    )
  }
  if (!ADDRESS_REGEX.test(CONTRACT_ADDRESS)) {
    throw new Error(
      `Invalid contract address constant: "${CONTRACT_ADDRESS}". Check constants.ts.`,
    )
  }

  // Ensure MetaMask is on Studio Network before sending — otherwise viem
  // throws a generic "Transaction chainId doesn't match dapp chainId" error.
  await ensureChain()

  const submittedAt = new Date().toISOString()
  const inputLength = primaryInput.length + secondaryInput.length
  const gas = 8_000_000n + BigInt(inputLength) * 200n

  // Debug log — keep until submit flow is verified, then we strip it.
  console.log("[Credence] submitAnalysis →", {
    contract: CONTRACT_ADDRESS,
    account: accountAddress,
    submitter: submitterAddress,
    analysisType,
    submittedAt,
    gas: gas.toString(),
    primaryLen: primaryInput.length,
    secondaryLen: secondaryInput.length,
  })

  return await (client as any).writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: "analyze",
    args: [
      analysisType,
      primaryInput,
      domainOrType,
      secondaryInput,
      submitterAddress,
      submittedAt,
    ],
    account: asJsonRpcAccount(accountAddress),
    gas,
  })
}

export async function getResult(resultId: string) {
  return await (client as any).readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_result",
    args: [resultId],
  })
}

export async function getAllResults() {
  return await (client as any).readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_all_results",
    args: [],
  })
}

export async function getMyFiles(address: string) {
  return await (client as any).readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_results_by_submitter",
    args: [address],
  })
}

export async function getResultCount() {
  return await (client as any).readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName: "get_result_count",
    args: [],
  })
}

/**
 * Connect MetaMask & switch to Studio Network if needed.
 */
export async function connectWallet(): Promise<string> {
  const eth = (window as any).ethereum
  if (!eth) {
    throw new Error("MetaMask not detected. Install the extension to continue.")
  }

  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" })
  const address = accounts[0]

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    })
  } catch (e: any) {
    if (e?.code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "GenLayer Studio",
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: ["https://studio.genlayer.com/api"],
            blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
          },
        ],
      })
    } else {
      throw e
    }
  }

  return address
}

/**
 * Parse a key_findings JSON string into a list. Contract stores it as
 * JSON.dumps([...]) inside TreeMap[str, str].
 */
export function parseKeyFindings(raw: string): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : []
  } catch {
    return []
  }
}
