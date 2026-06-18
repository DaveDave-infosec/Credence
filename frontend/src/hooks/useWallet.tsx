import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { connectWallet } from "../lib/genlayer"

const STORAGE_KEY = "credence_wallet_address"

function isValidAddress(value: any): value is string {
  return (
    typeof value === "string" &&
    /^0x[0-9a-fA-F]{40}$/.test(value)
  )
}

function readStoredAddress(): string | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!isValidAddress(stored)) {
    if (stored) localStorage.removeItem(STORAGE_KEY)
    return null
  }
  return stored
}

type WalletCtx = {
  address: string | null
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const Ctx = createContext<WalletCtx | null>(null)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(readStoredAddress)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const addr = await connectWallet()
      if (!isValidAddress(addr)) {
        throw new Error("MetaMask returned an invalid wallet address. Try reconnecting.")
      }
      setAddress(addr)
      localStorage.setItem(STORAGE_KEY, addr)
    } catch (e: any) {
      setError(e?.message || "Failed to connect wallet")
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    const eth = (window as any).ethereum
    if (!eth) return

    const handleAccountsChanged = (accounts: string[]) => {
      const first = accounts?.[0]
      if (!isValidAddress(first)) {
        setAddress(null)
        localStorage.removeItem(STORAGE_KEY)
      } else {
        setAddress(first)
        localStorage.setItem(STORAGE_KEY, first)
      }
    }

    eth.on?.("accountsChanged", handleAccountsChanged)
    return () => {
      eth.removeListener?.("accountsChanged", handleAccountsChanged)
    }
  }, [])

  return (
    <Ctx.Provider value={{ address, connecting, error, connect, disconnect }}>
      {children}
    </Ctx.Provider>
  )
}

export function useWallet(): WalletCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useWallet must be used within WalletProvider")
  return ctx
}
