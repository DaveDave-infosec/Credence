import { useState, useEffect, type FormEvent } from "react"
import { type ProtocolId, PROTOCOLS } from "../../lib/constants"
import FileDropZone from "./FileDropZone"
import "./AnalysisForm.css"

const FIELD_CONFIG = {
  credential: {
    domainLabel: "Credential Type",
    domainPlaceholder: "e.g. AWS Solutions Architect, BSc Computer Science...",
    primaryLabel: "Credential Content",
    primaryPlaceholder: "Paste credential text, or upload a file above to extract automatically...",
    showSecondary: false,
    secondaryLabel: "",
    secondaryPlaceholder: "",
  },
  competency: {
    domainLabel: "Domain of Claimed Expertise",
    domainPlaceholder: "e.g. Network Security, Distributed Systems, Smart Contract Design...",
    primaryLabel: "Evaluation Response",
    primaryPlaceholder: "Provide your response demonstrating domain understanding. Be specific & detailed...",
    showSecondary: true,
    secondaryLabel: "Background & Experience Statement",
    secondaryPlaceholder: "Briefly describe your background, training, & relevant experience...",
  },
  ai_dependence: {
    domainLabel: "Submission Context",
    domainPlaceholder: "e.g. Academic essay, technical writeup, code review...",
    primaryLabel: "Submission for Review",
    primaryPlaceholder: "Paste the work to be evaluated for AI dependence signals...",
    showSecondary: false,
    secondaryLabel: "",
    secondaryPlaceholder: "",
  },
  portfolio: {
    domainLabel: "Claimed Experience Level",
    domainPlaceholder: "e.g. Junior, Mid-level, Senior Engineer with 5+ years...",
    primaryLabel: "Portfolio Description & Project Details",
    primaryPlaceholder: "Describe your portfolio, specific projects, contributions, & technical depth...",
    showSecondary: false,
    secondaryLabel: "",
    secondaryPlaceholder: "",
  },
} as const

interface Props {
  protocol: ProtocolId
  onSubmit: (data: {
    primaryInput: string
    domainOrType: string
    secondaryInput: string
  }) => void
  disabled?: boolean
  walletConnected: boolean
  onConnect: () => void
  connecting: boolean
}

const MAX_PRIMARY = 6000
const MAX_SECONDARY = 2000
const MAX_DOMAIN = 200

export default function AnalysisForm({
  protocol,
  onSubmit,
  disabled,
  walletConnected,
  onConnect,
  connecting,
}: Props) {
  const config = FIELD_CONFIG[protocol]
  const [domain, setDomain] = useState("")
  const [primary, setPrimary] = useState("")
  const [secondary, setSecondary] = useState("")

  useEffect(() => {
    setDomain("")
    setPrimary("")
    setSecondary("")
  }, [protocol])

  const canSubmit =
    !disabled &&
    domain.trim().length > 0 &&
    primary.trim().length > 0 &&
    (!config.showSecondary || secondary.trim().length > 0)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      primaryInput: primary.slice(0, MAX_PRIMARY),
      domainOrType: domain.slice(0, MAX_DOMAIN),
      secondaryInput: secondary.slice(0, MAX_SECONDARY),
    })
  }

  const handleExtracted = (text: string) => {
    setPrimary(text.slice(0, MAX_PRIMARY))
  }

  return (
    <form className="analysis-form" onSubmit={handleSubmit}>
      <div className="label-mono analysis-form-label">
        Protocol: {PROTOCOLS[protocol].label}
      </div>

      <div className="form-field">
        <label className="form-field-label">{config.domainLabel}</label>
        <input
          className="form-input"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value.slice(0, MAX_DOMAIN))}
          placeholder={config.domainPlaceholder}
          disabled={disabled}
        />
      </div>

      {config.showSecondary && (
        <div className="form-field">
          <label className="form-field-label">{config.secondaryLabel}</label>
          <div className="form-textarea-wrapper">
            <textarea
              className="form-textarea"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value.slice(0, MAX_SECONDARY))}
              placeholder={config.secondaryPlaceholder}
              disabled={disabled}
              rows={4}
            />
            <div className="form-textarea-counter">
              {secondary.length} / {MAX_SECONDARY}
            </div>
          </div>
        </div>
      )}

      <div className="form-field">
        <label className="form-field-label">{config.primaryLabel}</label>

        {protocol === "credential" && (
          <FileDropZone
            onExtracted={handleExtracted}
            maxChars={MAX_PRIMARY}
            disabled={disabled}
          />
        )}

        <div className="form-textarea-wrapper">
          <textarea
            className="form-textarea"
            value={primary}
            onChange={(e) => setPrimary(e.target.value.slice(0, MAX_PRIMARY))}
            placeholder={config.primaryPlaceholder}
            disabled={disabled}
            rows={10}
          />
          <div className="form-textarea-counter">
            {primary.length} / {MAX_PRIMARY}
          </div>
        </div>
        {protocol === "credential" && (
          <div className="form-field-hint">
            Uploaded from a scan or photo? Review the text above & trim any garbled lines before submitting. Validators evaluate the text content, so clean input gives a cleaner verdict.
          </div>
        )}
      </div>

      <div className="form-submit">
        {walletConnected ? (
          <button type="submit" className="btn-institutional" disabled={!canSubmit}>
            SUBMIT FOR EVALUATION →
          </button>
        ) : (
          <button
            type="button"
            className="btn-institutional"
            onClick={onConnect}
            disabled={connecting}
          >
            {connecting ? "CONNECTING..." : "CONNECT WALLET TO SUBMIT →"}
          </button>
        )}
      </div>
    </form>
  )
}
