"""OrchestratorAgent — LangGraph-based coordinator for all specialized agents."""
from __future__ import annotations
from typing import TypedDict, Any
import concurrent.futures

from langgraph.graph import StateGraph, END

from backend.agents.extraction_agent import ExtractionAgent
from backend.agents.classification_agent import ClassificationAgent
from backend.agents.anomaly_detection_agent import AnomalyDetectionAgent
from backend.agents.summary_agent import SummaryAgent
from backend.agents.rag_agent import RAGAgent
from backend.utils.logger import get_logger

logger = get_logger(__name__)


# ── Shared state definition ───────────────────────────────────────────────────

class PipelineState(TypedDict, total=False):
    # Inputs
    file_path: str
    document_id: int
    # Intermediate
    raw_text: str
    document_type: str
    # Outputs
    summary: str
    anomalies: list[dict[str, Any]]
    risk_score: float
    rag_indexed: bool
    # Final report
    report: dict[str, Any]


# ── Agent singletons ──────────────────────────────────────────────────────────

_extraction = ExtractionAgent()
_classification = ClassificationAgent()
_anomaly = AnomalyDetectionAgent()
_summary = SummaryAgent()
_rag = RAGAgent()


# ── Graph nodes ───────────────────────────────────────────────────────────────

def node_extract(state: PipelineState) -> PipelineState:
    logger.info("[Graph] → ExtractionAgent")
    return _extraction.run(dict(state))  # type: ignore[arg-type]


def node_classify(state: PipelineState) -> PipelineState:
    logger.info("[Graph] → ClassificationAgent")
    return _classification.run(dict(state))  # type: ignore[arg-type]


def node_parallel_analysis(state: PipelineState) -> PipelineState:
    """
    Run AnomalyDetectionAgent, SummaryAgent and RAGAgent in parallel
    using a thread pool so they don't block each other.
    """
    logger.info("[Graph] → Parallel: AnomalyDetectionAgent + SummaryAgent + RAGAgent")
    base_state = dict(state)

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        fut_anomaly = pool.submit(_anomaly.run, base_state.copy())
        fut_summary = pool.submit(_summary.run, base_state.copy())
        fut_rag = pool.submit(_rag.run, base_state.copy())

        anomaly_state = fut_anomaly.result()
        summary_state = fut_summary.result()
        rag_state = fut_rag.result()

    # Merge results back
    state["anomalies"] = anomaly_state.get("anomalies", [])
    state["risk_score"] = anomaly_state.get("risk_score", 0.0)
    state["summary"] = summary_state.get("summary", "")
    state["rag_indexed"] = rag_state.get("rag_indexed", False)
    return state


def node_build_report(state: PipelineState) -> PipelineState:
    """Assemble the final analysis report from all agent outputs."""
    logger.info("[Graph] → Building final report")
    report: dict[str, Any] = {
        "document_type": state.get("document_type", "inconnu"),
        "summary": state.get("summary", ""),
        "anomalies_detectees": state.get("anomalies", []),
        "score_risque": state.get("risk_score", 0.0),
        "rag_pret": state.get("rag_indexed", False),
        "nb_anomalies": len(state.get("anomalies", [])),
    }
    state["report"] = report
    logger.info(
        "[Graph] → Report built: type=%s, risk=%.4f, anomalies=%d",
        report["document_type"],
        report["score_risque"],
        report["nb_anomalies"],
    )
    return state


# ── Graph construction ────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    g = StateGraph(PipelineState)

    g.add_node("extraction", node_extract)
    g.add_node("classification", node_classify)
    g.add_node("parallel_analysis", node_parallel_analysis)
    g.add_node("report", node_build_report)

    g.set_entry_point("extraction")
    g.add_edge("extraction", "classification")
    g.add_edge("classification", "parallel_analysis")
    g.add_edge("parallel_analysis", "report")
    g.add_edge("report", END)

    return g


_compiled_graph = _build_graph().compile()


# ── Public API ────────────────────────────────────────────────────────────────

class OrchestratorAgent:
    """
    Entry point for the multi-agent pipeline.
    Call `run(file_path, document_id)` to execute the full workflow.
    """

    def run(self, file_path: str, document_id: int) -> dict[str, Any]:
        """
        Execute the full LangGraph pipeline and return the final report.
        """
        logger.info(
            "OrchestratorAgent — starting pipeline for document %d (%s)",
            document_id,
            file_path,
        )
        print(f"\n[Orchestrator] === Pipeline start ===")
        print(f"[Orchestrator] Current document: {file_path}")
        print(f"[Orchestrator] document_id     : {document_id}")
        print(f"[Orchestrator] Initial state keys: file_path, document_id (fresh — no carry-over)")

        # Fresh state per invocation — no shared mutable state between calls.
        initial_state: PipelineState = {
            "file_path": file_path,
            "document_id": document_id,
        }
        final_state = _compiled_graph.invoke(initial_state)
        logger.info("OrchestratorAgent — pipeline complete")
        print(f"[Orchestrator] Pipeline complete — document_id={document_id}")
        return {
            "raw_text": final_state.get("raw_text", ""),
            "document_type": final_state.get("document_type", ""),
            "report": final_state.get("report", {}),
        }
