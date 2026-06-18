import { useEffect, useState } from "react"
import { getResult } from "../lib/genlayer"

export interface ResultData {
  result_id: string
  analysis_type: string
  submitter: string
  domain_or_type: string
  input_preview: string
  overall_score: number
  depth_score: number
  reasoning_quality: number
  ai_independence: number
  domain_accuracy: number
  authenticity_score: number
  originality_score: number
  consensus_verdict: string
  confidence_level: string
  majority_position: string
  minority_position: string
  key_findings: string
  recommendation: string
  submitted_at: string
}

function normalize(raw: any): ResultData {
  return {
    result_id: String(raw.result_id || ""),
    analysis_type: String(raw.analysis_type || ""),
    submitter: String(raw.submitter || ""),
    domain_or_type: String(raw.domain_or_type || ""),
    input_preview: String(raw.input_preview || ""),
    overall_score: Number(raw.overall_score || 0),
    depth_score: Number(raw.depth_score || 0),
    reasoning_quality: Number(raw.reasoning_quality || 0),
    ai_independence: Number(raw.ai_independence || 0),
    domain_accuracy: Number(raw.domain_accuracy || 0),
    authenticity_score: Number(raw.authenticity_score || 0),
    originality_score: Number(raw.originality_score || 0),
    consensus_verdict: String(raw.consensus_verdict || "Unknown"),
    confidence_level: String(raw.confidence_level || "Low"),
    majority_position: String(raw.majority_position || ""),
    minority_position: String(raw.minority_position || ""),
    key_findings: String(raw.key_findings || "[]"),
    recommendation: String(raw.recommendation || ""),
    submitted_at: String(raw.submitted_at || ""),
  }
}

export function useResult(resultId: string | undefined) {
  const [data, setData] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resultId) {
      setLoading(false)
      setError("No result ID provided")
      return
    }

    setLoading(true)
    setError(null)

    getResult(resultId)
      .then((res) => {
        const r = res as any
        if (!r || r.error || !r.consensus_verdict) {
          setError(`Case file ${resultId} not found`)
          setData(null)
        } else {
          setData(normalize(r))
        }
      })
      .catch((e) => {
        setError(e?.message || "Failed to load case file")
        setData(null)
      })
      .finally(() => setLoading(false))
  }, [resultId])

  return { data, loading, error }
}
