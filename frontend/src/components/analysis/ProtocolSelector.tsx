import { PROTOCOLS, type ProtocolId } from "../../lib/constants"
import "./ProtocolSelector.css"

interface Props {
  selected: ProtocolId
  onChange: (id: ProtocolId) => void
  disabled?: boolean
}

export default function ProtocolSelector({ selected, onChange, disabled }: Props) {
  return (
    <section className="protocol-selector">
      <div className="label-mono protocol-selector-label">Analysis Protocol</div>
      <div className="protocol-list">
        {(Object.keys(PROTOCOLS) as ProtocolId[]).map((id) => {
          const p = PROTOCOLS[id]
          const isSelected = selected === id
          return (
            <button
              key={id}
              type="button"
              className={`protocol-row ${isSelected ? "selected" : ""}`}
              onClick={() => onChange(id)}
              disabled={disabled}
            >
              <div className="protocol-radio">
                <div className="protocol-radio-dot" />
              </div>
              <div className="protocol-content">
                <div className="protocol-name">{p.label}</div>
                <div className="protocol-description">{p.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
