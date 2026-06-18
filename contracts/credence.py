# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import typing
import json


class Credence(gl.Contract):
    # Flat parallel TreeMaps — production-safe pattern.
    # No @allow_storage dataclasses — avoids silent storage rollback bug.

    result_ids: DynArray[str]
    analysis_type: TreeMap[str, str]
    submitter: TreeMap[str, str]
    domain_or_type: TreeMap[str, str]
    input_preview: TreeMap[str, str]

    overall_score: TreeMap[str, u64]
    depth_score: TreeMap[str, u64]
    reasoning_quality: TreeMap[str, u64]
    ai_independence: TreeMap[str, u64]
    domain_accuracy: TreeMap[str, u64]
    authenticity_score: TreeMap[str, u64]
    originality_score: TreeMap[str, u64]

    consensus_verdict: TreeMap[str, str]
    confidence_level: TreeMap[str, str]
    majority_position: TreeMap[str, str]
    minority_position: TreeMap[str, str]

    key_findings: TreeMap[str, str]
    recommendation: TreeMap[str, str]

    submitted_at: TreeMap[str, str]

    result_counter: u64

    def __init__(self):
        self.result_counter = u64(0)

    @gl.public.write
    def analyze(
        self,
        analysis_type: str,
        primary_input: str,
        domain_or_type: str,
        secondary_input: str,
        submitter_address: str,
        submitted_at: str,
    ) -> str:
        # Truncate inputs & copy ALL to locals.
        # self is NOT accessible inside non-det blocks — close over locals only.
        p_input = primary_input[:6000]
        s_input = secondary_input[:2000]
        # Normalize input — handle bytes, whitespace, & case.
        if isinstance(analysis_type, bytes):
            a_type = analysis_type.decode("utf-8", errors="ignore")
        else:
            a_type = str(analysis_type)
        a_type = a_type.strip().strip("'\"").lower()
        domain = domain_or_type
        addr = submitter_address
        ts = submitted_at

        # Build prompt based on analysis type.
        if a_type == "credential":
            prompt = f"""You are Credence — a ruthless credential authenticity evaluator.

Credential Type: {domain}
Credential Content: {p_input}

Evaluate:
1. Signs of authenticity or fabrication?
2. Formatting anomalies or suspicious patterns?
3. Does issuer pattern match known legitimate institutions?
4. Is terminology & structure consistent with real credentials?

Do NOT state definitively fake or real — express consensus confidence only.

CRITICAL — Two-part disagreement insight:
majority_position: where most evaluators agreed
minority_position: where some evaluators dissented & why
Make these feel like real evaluation panel notes.

Respond ONLY as valid JSON, no markdown:
{{"overall_score": 0-100, "depth_score": 50, "reasoning_quality": 50,
"ai_independence": 50, "domain_accuracy": 0-100, "authenticity_score": 0-100,
"originality_score": 50,
"consensus_verdict": "Strong Authenticity|Moderate Authenticity|Authenticity Contested|Low Authenticity|Likely Fabricated",
"confidence_level": "High|Moderate|Low|Contested",
"majority_position": "where most validators agreed",
"minority_position": "where some validators dissented",
"key_findings": ["finding 1", "finding 2", "finding 3"],
"recommendation": "one sentence"}}"""

        elif a_type == "competency":
            prompt = f"""You are Credence — a competency evaluation engine.

Domain claimed: {domain}
Background claim: {s_input}
Evaluation responses: {p_input}

Evaluate:
1. Does reasoning demonstrate genuine domain understanding?
2. Depth beyond surface memorization?
3. Evidence of AI-generated or copy-pasted responses?
4. Does demonstrated competency match claimed level?

Be ruthless. Surface-level answers score low even if technically correct.

CRITICAL — Two-part disagreement:
majority_position: what most validators concluded
minority_position: where validators split & the specific tension

Respond ONLY as valid JSON:
{{"overall_score": 0-100, "depth_score": 0-100, "reasoning_quality": 0-100,
"ai_independence": 0-100, "domain_accuracy": 0-100, "authenticity_score": 50,
"originality_score": 50,
"consensus_verdict": "Strong Competency|Moderate Competency|Basic Competency|Competency Contested|Insufficient Evidence|AI Dependence Suspected",
"confidence_level": "High|Moderate|Low|Contested",
"majority_position": "majority validator conclusion",
"minority_position": "dissenting validator position",
"key_findings": ["finding 1", "finding 2", "finding 3", "finding 4"],
"recommendation": "one sentence"}}"""

        elif a_type == "ai_dependence":
            prompt = f"""You are Credence — an AI dependence & genuine understanding detector.

Context: {domain}
Submission: {p_input}

Evaluate:
1. Signs of AI overreliance or AI generation?
2. Original reasoning or generic LLM response patterns?
3. Genuine comprehension or surface-level pattern matching?

IMPORTANT: AI assistance is not inherently bad.
The question is: does genuine understanding exist?

majority_position: where validators agreed on AI independence assessment
minority_position: where validators disagreed on AI vs genuine reasoning signals

Respond ONLY as valid JSON:
{{"overall_score": 0-100, "depth_score": 0-100, "reasoning_quality": 0-100,
"ai_independence": 0-100, "domain_accuracy": 50, "authenticity_score": 50,
"originality_score": 50,
"consensus_verdict": "Strong Independence|Moderate Independence|AI-Assisted but Understood|Heavy AI Dependence|Genuine Understanding Unclear|AI Overreliance Detected",
"confidence_level": "High|Moderate|Low|Contested",
"majority_position": "majority assessment",
"minority_position": "minority assessment",
"key_findings": ["finding 1", "finding 2", "finding 3"],
"recommendation": "one sentence"}}"""

        elif a_type == "portfolio":
            prompt = f"""You are Credence — a portfolio legitimacy & originality evaluator.

Portfolio description: {p_input}
Level claimed: {domain}

Evaluate:
1. Evidence of original work & genuine contribution?
2. Technical depth consistent with claimed experience?
3. Signs of copied, scaffolded, or AI-generated content?
4. Consistent growth & real problem-solving evidence?

majority_position: where validators converged on portfolio quality
minority_position: where validators split on specific dimensions

Respond ONLY as valid JSON:
{{"overall_score": 0-100, "depth_score": 0-100, "reasoning_quality": 50,
"ai_independence": 0-100, "domain_accuracy": 50, "authenticity_score": 0-100,
"originality_score": 0-100,
"consensus_verdict": "Strong Portfolio|Solid Portfolio|Portfolio Contested|Depth Insufficient|Originality Questioned|Likely Fabricated",
"confidence_level": "High|Moderate|Low|Contested",
"majority_position": "majority assessment",
"minority_position": "dissenting assessment",
"key_findings": ["finding 1", "finding 2", "finding 3", "finding 4"],
"recommendation": "one sentence"}}"""

        else:
            raise Exception(
                "Invalid analysis_type: received " + repr(analysis_type) +
                " (type=" + str(type(analysis_type).__name__) +
                ", normalized=" + repr(a_type) + "). " +
                "Must be one of: credential, competency, ai_dependence, portfolio"
            )

        # Managed consensus via gl.eq_principle — runtime evaluates agreement
        # using a natural-language criteria rather than custom validator logic.
        # Safe with our flat-TreeMap storage pattern (no dataclasses involved).
        def gen_result():
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(res, (str, bytes, bytearray)):
                return json.loads(res)
            return res

        result = gl.eq_principle.prompt_comparative(
            gen_result,
            "Outputs are equivalent if both are well-structured JSON evaluations "
            "with the required fields (overall_score, consensus_verdict, "
            "majority_position, minority_position). Numeric scores may differ "
            "by up to 40 points & verdict labels may differ as long as both "
            "fall within a compatible assessment tier. Disagreement on "
            "majority_position & minority_position content is expected & should "
            "not block consensus — surfacing that disagreement is the feature.",
        )

        # Defensive: result may be a JSON string after eq_principle handling.
        if isinstance(result, (str, bytes, bytearray)):
            result = json.loads(result)

        # Write to flat parallel TreeMaps. No dataclasses. No gl.message.sender_address.
        result_id = "credence_" + str(self.result_counter)

        self.analysis_type[result_id] = a_type
        self.submitter[result_id] = addr
        self.domain_or_type[result_id] = domain
        self.input_preview[result_id] = p_input[:150]

        self.overall_score[result_id] = u64(int(result.get("overall_score", 0)))
        self.depth_score[result_id] = u64(int(result.get("depth_score", 0)))
        self.reasoning_quality[result_id] = u64(int(result.get("reasoning_quality", 0)))
        self.ai_independence[result_id] = u64(int(result.get("ai_independence", 0)))
        self.domain_accuracy[result_id] = u64(int(result.get("domain_accuracy", 0)))
        self.authenticity_score[result_id] = u64(int(result.get("authenticity_score", 0)))
        self.originality_score[result_id] = u64(int(result.get("originality_score", 0)))

        self.consensus_verdict[result_id] = str(result.get("consensus_verdict", "Unknown"))
        self.confidence_level[result_id] = str(result.get("confidence_level", "Low"))
        self.majority_position[result_id] = str(result.get("majority_position", ""))
        self.minority_position[result_id] = str(result.get("minority_position", ""))

        self.key_findings[result_id] = json.dumps(result.get("key_findings", []))
        self.recommendation[result_id] = str(result.get("recommendation", ""))

        self.submitted_at[result_id] = ts

        self.result_ids.append(result_id)
        self.result_counter = u64(self.result_counter + 1)

        return result_id

    def _assemble_result(self, result_id: str) -> dict:
        return {
            "result_id": result_id,
            "analysis_type": self.analysis_type[result_id],
            "submitter": self.submitter[result_id],
            "domain_or_type": self.domain_or_type[result_id],
            "input_preview": self.input_preview[result_id],
            "overall_score": int(self.overall_score[result_id]),
            "depth_score": int(self.depth_score[result_id]),
            "reasoning_quality": int(self.reasoning_quality[result_id]),
            "ai_independence": int(self.ai_independence[result_id]),
            "domain_accuracy": int(self.domain_accuracy[result_id]),
            "authenticity_score": int(self.authenticity_score[result_id]),
            "originality_score": int(self.originality_score[result_id]),
            "consensus_verdict": self.consensus_verdict[result_id],
            "confidence_level": self.confidence_level[result_id],
            "majority_position": self.majority_position[result_id],
            "minority_position": self.minority_position[result_id],
            "key_findings": self.key_findings[result_id],
            "recommendation": self.recommendation[result_id],
            "submitted_at": self.submitted_at[result_id],
        }

    @gl.public.view
    def get_result(self, result_id: str) -> dict:
        try:
            return self._assemble_result(result_id)
        except Exception:
            return {"error": "not_found", "result_id": result_id}

    @gl.public.view
    def get_all_results(self) -> list:
        results = []
        n = len(self.result_ids)
        for i in range(n - 1, -1, -1):
            rid = self.result_ids[i]
            try:
                results.append(self._assemble_result(rid))
            except Exception:
                continue
        return results

    @gl.public.view
    def get_results_by_submitter(self, submitter_addr: str) -> list:
        results = []
        n = len(self.result_ids)
        for i in range(n - 1, -1, -1):
            rid = self.result_ids[i]
            try:
                if self.submitter[rid] == submitter_addr:
                    results.append(self._assemble_result(rid))
            except Exception:
                continue
        return results

    @gl.public.view
    def get_result_count(self) -> u64:
        return self.result_counter
