import { useEffect, useState } from "react"
import "./BureauLoader.css"

const STAGES = [
  {
    num: "01",
    name: "CREDENTIAL REVIEW UNIT",
    line: "Reviewing issuer patterns & formatting...",
    startAt: 0,
    duration: 18,
  },
  {
    num: "02",
    name: "COMPETENCY ASSESSMENT UNIT",
    line: "Evaluating reasoning depth & domain accuracy...",
    startAt: 18,
    duration: 18,
  },
  {
    num: "03",
    name: "AUTHENTICITY UNIT",
    line: "Reviewing originality signals & coherence...",
    startAt: 36,
    duration: 18,
  },
  {
    num: "04",
    name: "CONSENSUS FORMATION",
    line: "Validators reaching agreement...",
    startAt: 54,
    duration: 100,
  },
]

const BAR_WIDTH = 20

function progressBar(filled: number): string {
  const f = Math.min(BAR_WIDTH, Math.max(0, filled))
  return "█".repeat(f) + "░".repeat(BAR_WIDTH - f)
}

export default function BureauLoader() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0")
  const secs = (elapsed % 60).toString().padStart(2, "0")

  return (
    <div className="bureau-loader">
      <div className="bureau-loader-inner">
        <div className="bureau-title">CREDENCE ANALYSIS BUREAU</div>
        <hr className="bureau-rule" />

        <div className="bureau-status">CASE FILE OPENED</div>

        <div className="bureau-stages">
          {STAGES.map((stage, idx) => {
            const isLast = idx === STAGES.length - 1
            const stageElapsed = elapsed - stage.startAt
            let stageStatus: "queued" | "in_progress" | "complete"
            let bar: string

            if (elapsed < stage.startAt) {
              stageStatus = "queued"
              bar = progressBar(0)
            } else if (isLast) {
              stageStatus = "in_progress"
              const fillRatio = Math.min(0.95, stageElapsed / 30)
              bar = progressBar(Math.floor(fillRatio * BAR_WIDTH))
            } else if (stageElapsed >= stage.duration) {
              stageStatus = "complete"
              bar = progressBar(BAR_WIDTH)
            } else {
              stageStatus = "in_progress"
              const fillRatio = stageElapsed / stage.duration
              bar = progressBar(Math.floor(fillRatio * BAR_WIDTH))
            }

            return (
              <div key={stage.num} className={`bureau-stage status-${stageStatus}`}>
                <div className="bureau-stage-header">
                  <span className="bureau-stage-num">[ {stage.num} ]</span>
                  <span className="bureau-stage-name">{stage.name}</span>
                </div>
                <div className="bureau-stage-line">{stage.line}</div>
                <div className="bureau-stage-bar">
                  <span className="bureau-stage-bar-fill">{bar}</span>
                  <span className="bureau-stage-bar-label">
                    {stageStatus === "complete" && "COMPLETE"}
                    {stageStatus === "in_progress" && (
                      <span className="blink">IN PROGRESS</span>
                    )}
                    {stageStatus === "queued" && "QUEUED"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <hr className="bureau-rule" />
        <div className="bureau-footer">
          ESTIMATED COMPLETION: 30–90 SECONDS
        </div>
        <div className="bureau-elapsed">
          ELAPSED: {mins}:{secs}
        </div>
      </div>
    </div>
  )
}
