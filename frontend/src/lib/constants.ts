// Credence — environment constants & protocol metadata

export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string) ||
  "0x1c574AB4a372DD7502B925C2527a637CF3c3E642"

export const CHAIN_ID = 61999
export const CHAIN_ID_HEX = "0xF22F"

export const PROTOCOLS = {
  credential: {
    id: "credential",
    label: "Credential Verification",
    descriptors: "Issuer authenticity · Formatting integrity · Legitimacy confidence",
    description:
      "Evaluate issuer authenticity, formatting integrity, & legitimacy confidence of submitted credentials.",
  },
  competency: {
    id: "competency",
    label: "Competency Validation",
    descriptors: "Reasoning depth · Domain accuracy · AI independence assessment",
    description:
      "Assess reasoning depth, domain accuracy, & genuine understanding beyond surface-level responses.",
  },
  ai_dependence: {
    id: "ai_dependence",
    label: "AI Dependence Detection",
    descriptors: "Originality signals · Comprehension markers · Overreliance indicators",
    description:
      "Identify overreliance signals, originality markers, & genuine comprehension vs pattern matching.",
  },
  portfolio: {
    id: "portfolio",
    label: "Portfolio Authenticity",
    descriptors: "Contribution evidence · Technical depth · Originality verification",
    description:
      "Verify contribution evidence, technical depth, & originality of submitted work.",
  },
} as const

export type ProtocolId = keyof typeof PROTOCOLS
