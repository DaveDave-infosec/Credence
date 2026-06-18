import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllResults } from "../lib/genlayer"
import { useWallet } from "../hooks/useWallet"
import { PROTOCOLS, type ProtocolId } from "../lib/constants"
import "./Archive.css"

type ResultRow = {
  result_id: string
  analysis_type: string
  domain_or_type: string
  consensus_verdict: string
  submitted_at: string
  submitter: string
}

function shortDate(value: any): string {
  if (!value) return ""
  try {
    const str = String(value).trim()
    if (!str) return ""
    const d = new Date(str)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

function verdictTier(verdict: string): "strong" | "moderate" | "contested" | "low" {
  const v = (verdict || "").toLowerCase()
  if (
    v.includes("contested") ||
    v.includes("dependence suspected") ||
    v.includes("questioned") ||
    v.includes("overreliance") ||
    v.includes("fabricated")
  ) return "contested"
  if (v.includes("strong") || v.includes("solid")) return "strong"
  if (v.includes("moderate") || v.includes("basic") || v.includes("assisted") || v.includes("independence")) {
    return "moderate"
  }
  return "low"
}

export default function MyFiles() {
  const nav = useNavigate()
  const { address, connect, connecting } = useWallet()
  const [results, setResults] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    getAllResults()
      .then((res) => {
        const all = (res as ResultRow[]) || []
        // Case-insensitive submitter match — Studio submissions land checksummed,
        // MetaMask submissions land lowercase. Same wallet, different casing.
        const mine = all.filter(
          (r) =>
            typeof r.submitter === "string" &&
            r.submitter.toLowerCase() === address.toLowerCase(),
        )
        setResults(mine)
      })
      .catch((e) => {
        console.error("getAllResults failed:", e)
        setError(e?.message || "Failed to load your files")
        setResults([])
      })
      .finally(() => setLoading(false))
  }, [address])

  return (
    <div className="archive-page">
      <div className="container">
        <header className="archive-header">
          <h1 className="archive-title">My Case Files</h1>
          <p className="archive-subtitle">
            Personal evaluation history — connected wallet only
          </p>
        </header>

        <hr className="rule" />

        {!address ? (
          <div className="archive-state archive-state-action">
            <div>Connect your wallet to view your personal case file history.</div>
            <button
              className="btn-institutional"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "CONNECTING..." : "[ CONNECT WALLET ]"}
            </button>
          </div>
        ) : loading ? (
          <div className="archive-state">Loading your files...</div>
        ) : error ? (
          <div className="archive-state error">{error}</div>
        ) : results.length === 0 ? (
          <div className="archive-state">
            No case files on record. Submit your first evaluation to open a file.
          </div>
        ) : (
          <table className="archive-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Protocol</th>
                <th>Subject</th>
                <th>Verdict</th>
                <th className="align-right">Filed</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.result_id} onClick={() => nav(`/result/${r.result_id}`)}>
                  <td className="mono">{r.result_id}</td>
                  <td>{PROTOCOLS[r.analysis_type as ProtocolId]?.label.split(" ")[0] || r.analysis_type}</td>
                  <td>{r.domain_or_type}</td>
                  <td className={`verdict verdict-${verdictTier(r.consensus_verdict)}`}>
                    {(r.consensus_verdict || "").toUpperCase()}
                  </td>
                  <td className="align-right mono">{shortDate(r.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
