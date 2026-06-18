import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useResult, type ResultData } from "../hooks/useResult"
import { PROTOCOLS, type ProtocolId } from "../lib/constants"
import { parseKeyFindings } from "../lib/genlayer"
import "./Result.css"

function abbreviate(addr: string): string {
  if (!addr || addr.length < 10) return addr || ""
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(iso: string): string {
  if (!iso) return ""
  try {
    const d = new Date(String(iso).trim())
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return iso
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return ""
  try {
    const d = new Date(String(iso).trim())
    if (isNaN(d.getTime())) return iso
    const date = d.toISOString().slice(0, 10)
    const time = d.toISOString().slice(11, 16)
    return `${date} ${time} UTC`
  } catch {
    return iso
  }
}

function verdictColorClass(verdict: string): string {
  const v = (verdict || "").toLowerCase()
  if (
    v.includes("contested") ||
    v.includes("dependence suspected") ||
    v.includes("questioned") ||
    v.includes("overreliance") ||
    v.includes("fabricated")
  ) return "verdict-contested"
  if (v.includes("strong") || v.includes("solid")) return "verdict-strong"
  if (v.includes("moderate") || v.includes("basic") || v.includes("assisted") || v.includes("independence")) {
    return "verdict-moderate"
  }
  return "verdict-low"
}

function ratingFromScore(score: number): { label: string; className: string; bar: string } {
  const BAR_WIDTH = 12
  const clamped = Math.max(0, Math.min(100, score))
  const filled = Math.round((clamped / 100) * BAR_WIDTH)
  const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled)

  if (score >= 86) return { label: "Exceptional", className: "rating-exceptional", bar }
  if (score >= 66) return { label: "Strong", className: "rating-strong", bar }
  if (score >= 41) return { label: "Moderate", className: "rating-moderate", bar }
  return { label: "Insufficient", className: "rating-insufficient", bar }
}

function getDimensions(analysisType: string, data: ResultData) {
  switch (analysisType) {
    case "credential":
      return [
        { name: "Domain Accuracy", score: data.domain_accuracy },
        { name: "Authenticity", score: data.authenticity_score },
        { name: "Overall Confidence", score: data.overall_score },
      ]
    case "competency":
      return [
        { name: "Reasoning Quality", score: data.reasoning_quality },
        { name: "Domain Accuracy", score: data.domain_accuracy },
        { name: "Depth of Understanding", score: data.depth_score },
        { name: "AI Independence", score: data.ai_independence },
      ]
    case "ai_dependence":
      return [
        { name: "AI Independence", score: data.ai_independence },
        { name: "Reasoning Quality", score: data.reasoning_quality },
        { name: "Depth of Understanding", score: data.depth_score },
      ]
    case "portfolio":
      return [
        { name: "Authenticity", score: data.authenticity_score },
        { name: "Originality", score: data.originality_score },
        { name: "Depth of Understanding", score: data.depth_score },
        { name: "AI Independence", score: data.ai_independence },
      ]
    default:
      return [{ name: "Overall Score", score: data.overall_score }]
  }
}

function CaseHeader({ data }: { data: ResultData }) {
  const proto = PROTOCOLS[data.analysis_type as ProtocolId]
  return (
    <div className="case-header">
      <div className="case-header-id">CASE FILE #{data.result_id}</div>
      <hr className="rule" />
      <table className="case-header-table">
        <tbody>
          <tr>
            <td className="case-header-label">SUBJECT</td>
            <td className="case-header-value">{data.domain_or_type}</td>
          </tr>
          <tr>
            <td className="case-header-label">PROTOCOL</td>
            <td className="case-header-value">{(proto?.label || data.analysis_type).toUpperCase()}</td>
          </tr>
          <tr>
            <td className="case-header-label">FILED</td>
            <td className="case-header-value">{formatDateTime(data.submitted_at)}</td>
          </tr>
          <tr>
            <td className="case-header-label">EVALUATOR</td>
            <td className="case-header-value mono">{abbreviate(data.submitter)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function VerdictBlock({ data }: { data: ResultData }) {
  return (
    <section className="verdict-block">
      <hr className="rule" />
      <div className="label-mono verdict-label">Verdict</div>
      <div className={`verdict-text ${verdictColorClass(data.consensus_verdict)}`}>
        {data.consensus_verdict.toUpperCase()}
      </div>
      <div className="verdict-confidence">
        CONFIDENCE: <span className="verdict-confidence-value">{data.confidence_level.toUpperCase()}</span>
      </div>
      <hr className="rule" />
    </section>
  )
}

function AssessmentMatrix({ data }: { data: ResultData }) {
  const dimensions = getDimensions(data.analysis_type, data)
  return (
    <section className="assessment-matrix">
      <div className="label-mono assessment-label">Dimensional Assessment</div>
      <table className="assessment-table">
        <thead>
          <tr>
            <th className="assessment-th">Dimension</th>
            <th className="assessment-th">Rating</th>
            <th className="assessment-th align-right">Signal</th>
          </tr>
        </thead>
        <tbody>
          {dimensions.map((dim) => {
            const r = ratingFromScore(dim.score)
            return (
              <tr key={dim.name}>
                <td className="assessment-dimension">{dim.name}</td>
                <td className={`assessment-rating ${r.className}`}>{r.label}</td>
                <td className={`assessment-signal align-right ${r.className}`}>
                  <span className="assessment-bar">{r.bar}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function DissentPanel({ data }: { data: ResultData }) {
  const isContested = data.confidence_level.toLowerCase() === "contested"
  return (
    <section className={`dissent-panel ${isContested ? "contested" : ""}`}>
      <div className="dissent-label">Evaluator Panel — Dissenting Record</div>
      <div className="dissent-position">
        <div className="dissent-position-label">MAJORITY POSITION</div>
        <div className="dissent-position-text">{data.majority_position}</div>
      </div>
      <hr className="rule dissent-rule" />
      <div className="dissent-position">
        <div className="dissent-position-label">MINORITY POSITION</div>
        <div className="dissent-position-text">{data.minority_position}</div>
      </div>
    </section>
  )
}

function FindingsLog({ data }: { data: ResultData }) {
  const findings = parseKeyFindings(data.key_findings)
  return (
    <section className="findings-log">
      <div className="label-mono findings-label">Evaluation Findings</div>
      <ul className="findings-list">
        {findings.map((f, i) => (
          <li key={i} className="findings-item">
            <span className="findings-bullet">—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <hr className="rule" />
      <div className="label-mono findings-label findings-recommendation-label">Recommendation</div>
      <div className="findings-recommendation">{data.recommendation}</div>
    </section>
  )
}

function MetadataRail({
  data,
  onShare,
  copied,
}: {
  data: ResultData
  onShare: () => void
  copied: boolean
}) {
  const nav = useNavigate()
  const proto = PROTOCOLS[data.analysis_type as ProtocolId]
  return (
    <aside className="metadata-rail">
      <div className="metadata-rail-inner">
        <div className="label-mono metadata-rail-label">Case Metadata</div>
        <hr className="rule" />
        <table className="metadata-table">
          <tbody>
            <tr><td>Case ID</td><td>{data.result_id}</td></tr>
            <tr><td>Protocol</td><td>{(proto?.label || data.analysis_type).split(" ")[0]}</td></tr>
            <tr><td>Filed</td><td>{formatDate(data.submitted_at)}</td></tr>
            <tr><td>Evaluator</td><td>{abbreviate(data.submitter)}</td></tr>
            <tr><td>Confidence</td><td className="metadata-confidence">{data.confidence_level.toUpperCase()}</td></tr>
            <tr><td>Score</td><td>{data.overall_score} / 100</td></tr>
            <tr><td>Verdict</td><td className={verdictColorClass(data.consensus_verdict)}>{data.consensus_verdict}</td></tr>
          </tbody>
        </table>
        <hr className="rule" />
        <div className="metadata-actions">
          <button className="metadata-btn" onClick={onShare}>
            {copied ? "COPIED" : "SHARE CASE FILE"}
          </button>
          <button className="metadata-btn secondary" onClick={() => nav("/analyze")}>
            OPEN NEW CASE
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function Result() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, loading, error } = useResult(id)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (!data) return
    const majorityFirst = data.majority_position.split(". ")[0]
    const text = `🗂 CREDENCE CASE FILE #${data.result_id} | Protocol: ${data.analysis_type} | Subject: ${data.domain_or_type} | Verdict: ${data.consensus_verdict} | Confidence: ${data.confidence_level} | Majority: ${majorityFirst} | Built on @GenLayerLabs Studio Network`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error("Failed to copy:", e)
    }
  }

  if (loading) {
    return (
      <div className="result-page">
        <div className="container">
          <div className="result-loading">Loading case file...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="result-page">
        <div className="container">
          <div className="result-error">
            <div className="result-error-title">Case File Not Found</div>
            <div className="result-error-message">{error || "This case file could not be loaded."}</div>
            <button className="btn-institutional" onClick={() => nav("/archive")}>
              ← RETURN TO ARCHIVE
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="result-page">
      <div className="container">
        <div className="result-grid">
          <div className="result-content">
            <CaseHeader data={data} />
            <VerdictBlock data={data} />
            <AssessmentMatrix data={data} />
            <DissentPanel data={data} />
            <FindingsLog data={data} />
          </div>
          <MetadataRail data={data} onShare={handleShare} copied={copied} />
        </div>
      </div>
    </div>
  )
}
