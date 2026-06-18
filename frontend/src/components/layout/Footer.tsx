import "./Footer.css"

export default function Footer() {
  return (
    <footer className="credence-footer">
      <div className="credence-footer-inner">
        <div className="credence-footer-left">
          <span className="credence-footer-wordmark">CREDENCE</span>
          <span className="credence-footer-sep">·</span>
          <span className="credence-footer-meta">Analysis Bureau</span>
        </div>
        <div className="credence-footer-right">
          <span className="credence-footer-meta">
            Powered by GenLayer Validators · Studio Network
          </span>
        </div>
      </div>
    </footer>
  )
}
