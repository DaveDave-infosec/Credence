import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { PROTOCOLS, type ProtocolId } from "../lib/constants"
import { getAllResults } from "../lib/genlayer"
import "./Home.css"

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
  if (v.includes("contested") || v.includes("dependence suspected") || v.includes("questioned") || v.includes("overreliance") || v.includes("fabricated")) {
    return "contested"
  }
  if (v.includes("strong") || v.includes("solid")) {
    return "strong"
  }
  if (v.includes("moderate") || v.includes("basic") || v.includes("assisted") || v.includes("independence")) {
    return "moderate"
  }
  return "low"
}

export default function Home() {
  const nav = useNavigate()
  const [recent, setRecent] = useState<ResultRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllResults()
      .then((res) => {
        const list = (res as ResultRow[]) || []
        setRecent(list.slice(0, 5))
      })
      .catch((err) => {
        console.error("getAllResults failed:", err)
        setRecent([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="credence-home">
      <section className="home-hero">
        <div className="container-narrow">
          <h1 className="home-hero-headline">
            CREDENCE
            <br />
            ANALYSIS BUREAU
          </h1>
          <p className="home-hero-body">
            Consensus intelligence for human competence.
            Four evaluation protocols. Independent validators.
            Verifiable findings — not opinions.
          </p>
          <Link to="/analyze" className="btn-institutional">
            OPEN A CASE FILE →
          </Link>
        </div>
      </section>

      <hr className="rule home-divider" />

      <section className="home-protocols">
        <div className="container">
          {(Object.keys(PROTOCOLS) as ProtocolId[]).map((id) => {
            const p = PROTOCOLS[id]
            return (
              <button
                key={id}
                className="home-protocol-row"
                onClick={() => nav(`/analyze?protocol=${id}`)}
              >
                <span className="home-protocol-label">{p.label.toUpperCase()}</span>
                <span className="home-protocol-connector" aria-hidden="true">──────────</span>
                <span className="home-protocol-descriptors">{p.descriptors}</span>
              </button>
            )
          })}
        </div>
      </section>

      <hr className="rule home-divider" />

      <section className="home-recent">
        <div className="container">
          <div className="label-mono home-recent-label">Recent Filings</div>
          {loading ? (
            <div className="home-recent-empty">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="home-recent-empty">
              No case files on record yet. Be the first to open one.
            </div>
          ) : (
            <table className="home-recent-table">
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
                {recent.map((r) => (
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
      </section>
    </div>
  )
}
