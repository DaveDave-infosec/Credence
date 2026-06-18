import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllResults } from "../lib/genlayer"
import { PROTOCOLS, type ProtocolId } from "../lib/constants"
import "./Archive.css"

type ResultRow = {
  result_id: string
  analysis_type: string
  domain_or_type: string
  consensus_verdict: string
  submitted_at: string
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

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "credential", label: "Credential" },
  { id: "competency", label: "Competency" },
  { id: "ai_dependence", label: "AI Detection" },
  { id: "portfolio", label: "Portfolio" },
]

export default function Archive() {
  const nav = useNavigate()
  const [results, setResults] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllResults()
      .then((res) => {
        const list = (res as ResultRow[]) || []
        setResults(list)
      })
      .catch((e) => {
        console.error("getAllResults failed:", e)
        setError(e?.message || "Failed to load archive")
        setResults([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === "all"
    ? results
    : results.filter((r) => r.analysis_type === filter)

  return (
    <div className="archive-page">
      <div className="container">
        <header className="archive-header">
          <h1 className="archive-title">Credence Archive</h1>
          <p className="archive-subtitle">
            Public evaluation records — GenLayer Studio Network
          </p>
        </header>

        <hr className="rule" />

        <div className="archive-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`archive-filter-tab ${filter === tab.id ? "active" : ""}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label.toUpperCase()}
              {filter === tab.id && <span className="archive-filter-underline" />}
            </button>
          ))}
        </div>

        <hr className="rule" />

        {loading ? (
          <div className="archive-state">Loading archive...</div>
        ) : error ? (
          <div className="archive-state error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="archive-state">
            {filter === "all"
              ? "No case files on record yet."
              : `No ${filter.replace("_", " ")} case files on record yet.`}
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
              {filtered.map((r) => (
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
