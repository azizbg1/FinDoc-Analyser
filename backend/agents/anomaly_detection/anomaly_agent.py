"""
AnomalyDetectionAgent — agent principal de détection d'anomalies.

Orchestre les deux détecteurs spécialisés et les fusionne :
  1. RuleBasedDetector   → règles métier
  2. StatisticalDetector → modèles ML (IF + SVM + LOF)
  3. AnomalyFusion       → fusion + déduplication + score de risque
"""
from __future__ import annotations
from typing import Any

from backend.agents.anomaly_detection.rule_based_detector import RuleBasedDetector
from backend.agents.anomaly_detection.statistical_detector import StatisticalDetector
from backend.agents.anomaly_detection.anomaly_fusion import AnomalyFusion
from backend.services.nlp_service import extract_financial_values
from backend.utils.logger import get_logger

logger = get_logger(__name__)


class AnomalyDetectionAgent:
    """
    Nœud LangGraph chargé de la détection complète des anomalies.

    État entrant :
      - raw_text      (str)  : texte extrait du document
      - document_type (str)  : type identifié par ClassificationAgent

    État sortant :
      - anomalies     (list) : anomalies détectées
      - risk_score    (float): score de risque global [0, 1]
    """

    def __init__(self) -> None:
        self._rule_detector = RuleBasedDetector()
        self._stat_detector = StatisticalDetector()
        self._fusion = AnomalyFusion()

    def run(self, state: dict) -> dict:
        raw_text: str = state.get("raw_text", "")
        doc_type: str = state.get("document_type", "autre")

        logger.info("AnomalyDetectionAgent — démarrage (type=%s)", doc_type)

        # 1. Détection par règles métier
        rule_anomalies = self._rule_detector.detect(raw_text, doc_type)
        logger.info("  Règles métier : %d anomalie(s)", len(rule_anomalies))

        # 2. Détection statistique (uniquement sur les vrais montants du document)
        amounts = extract_financial_values(raw_text)
        stat_anomalies = self._stat_detector.detect(amounts)
        logger.info("  Statistiques   : %d anomalie(s)", len(stat_anomalies))

        # 3. Fusion
        result: dict[str, Any] = self._fusion.fuse(rule_anomalies, stat_anomalies)

        state["anomalies"] = result["anomalies"]
        state["risk_score"] = result["risk_score"]

        print(f"\n[AnomalyAgent] === Résultat final ===")
        print(f"[AnomalyAgent] document_id  = {state.get('document_id')}")
        print(f"[AnomalyAgent] Final anomalies = {result['anomalies']}")
        print(f"[AnomalyAgent] risk_score      = {result['risk_score']:.4f}")

        logger.info(
            "AnomalyDetectionAgent — terminé : %d anomalie(s), score=%.4f",
            len(result["anomalies"]),
            result["risk_score"],
        )
        return state
