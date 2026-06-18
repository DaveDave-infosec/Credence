import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { useWallet } from "../../hooks/useWallet"
import "./Header.css"

function abbreviate(addr: string): string {
  if (addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function Header() {
  const { address, connecting, connect, disconnect, error } = useWallet()
  const loc = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  const handleCopy = async () => {
    if (!address) return
    try {
      await navigator.clipboard?.writeText(address)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setMenuOpen(false)
      }, 800)
    } catch {
      setMenuOpen(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setMenuOpen(false)
  }

  return (
    <header className="credence-header">
      <div className="credence-header-inner">
        <Link to="/" className="credence-wordmark">CREDENCE</Link>
        <nav className="credence-nav">
          <Link
            to="/archive"
            className={`credence-nav-link ${loc.pathname === "/archive" ? "active" : ""}`}
          >
            ARCHIVE
          </Link>
          <Link
            to="/my-files"
            className={`credence-nav-link ${loc.pathname === "/my-files" ? "active" : ""}`}
          >
            MY FILES
          </Link>
          {address ? (
            <div className="credence-wallet-wrapper" ref={menuRef}>
              <button
                className={`credence-wallet-btn ${menuOpen ? "open" : ""}`}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {abbreviate(address)}
                <span className="credence-wallet-caret" aria-hidden="true">▾</span>
              </button>
              {menuOpen && (
                <div className="credence-wallet-menu">
                  <button className="credence-wallet-menu-item" onClick={handleCopy}>
                    {copied ? "COPIED" : "COPY ADDRESS"}
                  </button>
                  <button
                    className="credence-wallet-menu-item disconnect"
                    onClick={handleDisconnect}
                  >
                    DISCONNECT
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="credence-wallet-btn connect"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "..." : "[ CONNECT ]"}
            </button>
          )}
        </nav>
      </div>
      {error && <div className="credence-header-error">{error}</div>}
    </header>
  )
}
