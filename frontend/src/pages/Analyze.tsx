import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import ProtocolSelector from "../components/analysis/ProtocolSelector"
import AnalysisForm from "../components/analysis/AnalysisForm"
import BureauLoader from "../components/analysis/BureauLoader"
import { useWallet } from "../hooks/useWallet"
import { useAnalyze } from "../hooks/useAnalyze"
import { type ProtocolId, PROTOCOLS } from "../lib/constants"
import "./Analyze.css"

export default function Analyze() {
  const [searchParams, setSearchParams] = useSearchParams()
  const nav = useNavigate()
  const { address, connect, connecting } = useWallet()
  const { status, error, analyze } = useAnalyze()

  const queryProtocol = searchParams.get("protocol") as ProtocolId | null
  const initial: ProtocolId =
    queryProtocol && queryProtocol in PROTOCOLS ? queryProtocol : "credential"

  const [protocol, setProtocol] = useState<ProtocolId>(initial)

  const handleProtocolChange = (newProtocol: ProtocolId) => {
    setProtocol(newProtocol)
    setSearchParams({ protocol: newProtocol }, { replace: true })
  }

  const handleSubmit = async (formData: {
    primaryInput: string
    domainOrType: string
    secondaryInput: string
  }) => {
    if (!address) {
      await connect()
      return
    }
    try {
      const resultId = await analyze(
        address,
        protocol,
        formData.primaryInput,
        formData.domainOrType,
        formData.secondaryInput,
      )
      nav(`/result/${resultId}`)
    } catch (e) {
      console.error("Analyze failed:", e)
    }
  }

  const isSubmitting = status === "submitting" || status === "waiting"

  return (
    <div className="credence-analyze">
      {isSubmitting && <BureauLoader />}

      <div className="container-narrow">
        <header className="analyze-header">
          <div className="label-mono">Credence Evaluation Intake</div>
          <h1 className="analyze-title">Open a Case File</h1>
          <p className="analyze-subtitle">
            Select an evaluation protocol & submit subject material.
            A case file will be opened upon submission & evaluated by independent validators.
          </p>
        </header>

        <hr className="rule" />

        <ProtocolSelector
          selected={protocol}
          onChange={handleProtocolChange}
          disabled={isSubmitting}
        />

        <hr className="rule" />

        <AnalysisForm
          protocol={protocol}
          onSubmit={handleSubmit}
          disabled={isSubmitting}
          walletConnected={!!address}
          onConnect={connect}
          connecting={connecting}
        />

        {error && <div className="analyze-error">{error}</div>}
      </div>
    </div>
  )
}
