import { useState, useCallback } from "react"
import { submitAnalysis, getResult, getResultCount } from "../lib/genlayer"

export type AnalyzeStatus = "idle" | "submitting" | "waiting" | "complete" | "error"

export function useAnalyze() {
  const [status, setStatus] = useState<AnalyzeStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [resultId, setResultId] = useState<string | null>(null)

  const analyze = useCallback(
    async (
      walletAddress: string,
      analysisType: string,
      primaryInput: string,
      domainOrType: string,
      secondaryInput: string,
    ): Promise<string> => {
      setStatus("submitting")
      setError(null)
      setResultId(null)

      try {
        // Predict the new result_id from current count.
        const beforeCountRaw = await getResultCount()
        const beforeCount = Number(beforeCountRaw)
        const predictedId = `credence_${beforeCount}`

        await submitAnalysis(
          analysisType,
          primaryInput,
          domainOrType,
          secondaryInput,
          walletAddress,
          walletAddress,
        )

        setStatus("waiting")

        // Poll for the result — up to 5 minutes.
        const maxAttempts = 150
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 2000))
          try {
            const result = await getResult(predictedId)
            const r = result as any
            if (r && r.consensus_verdict && !r.error) {
              setResultId(predictedId)
              setStatus("complete")
              return predictedId
            }
          } catch {
            // not ready yet, keep polling
          }
        }

        throw new Error("Transaction timed out. Check Studio explorer for status.")
      } catch (e: any) {
        const message = e?.message || "Submission failed"
        setError(message)
        setStatus("error")
        throw e
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setStatus("idle")
    setError(null)
    setResultId(null)
  }, [])

  return { status, error, resultId, analyze, reset }
}
