"""
AnomalyFusion — fusion et déduplication des résultats des deux détecteurs.

Calcul du score de risque :
  - HIGH   →  +0.30 par anomalie
  - MEDIUM →  +0.15 par anomalie
  - LOW    →  +0.05 par anomalie
  Score plafonné à 1.0
"""
from __future__ import annotations
from typing import Any

from backend.utils.logger import get_logger

logger = get_logger(__name__)

_SEVERITY_WEIGHTS: dict[str, float] = {
    "HIGH": 0.30,
    "MEDIUM": 0.15,
    "LOW": 0.05,
}


class AnomalyFusion:
    """Fusionne les anomalies métier et statistiques en supprimant les doublons."""

    def fuse(
        self,
        rule_anomalies: list[dict[str, Any]],
        stat_anomalies: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Retourne un dict avec :
          - anomalies  : liste dédupliquée triée par sévérité décroissante
          - risk_score : float en [0, 1]
        """
        merged = rule_anomalies + stat_anomalies
        deduplicated = self._deduplicate(merged)
        deduplicated = self._sort_by_severity(deduplicated)
        risk_score = self._compute_risk_score(deduplicated)

        logger.info(
            "AnomalyFusion — règles:%d + stat:%d → %d après déduplification, score=%.4f",
            len(rule_anomalies),
            len(stat_anomalies),
            len(deduplicated),
            risk_score,
        )
        return {"anomalies": deduplicated, "risk_score": risk_score}

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _deduplicate(self, anomalies: list[dict]) -> list[dict]:
        """Supprime les doublons en se basant sur (type, valeur normalisée)."""
        seen: set[tuple] = set()
        result: list[dict] = []
        for a in anomalies:
            key = (a.get("type", ""), self._normalise_value(a.get("value")))
            if key not in seen:
                seen.add(key)
                result.append(a)
        return result

    @staticmethod
    def _normalise_value(value: Any) -> str:
        """Transforme une valeur quelconque en clé de déduplication."""
        if isinstance(value, float):
            return f"{value:.2f}"
        return str(value)

    def _sort_by_severity(self, anomalies: list[dict]) -> list[dict]:
        order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        return sorted(anomalies, key=lambda a: order.get(a.get("severity", "LOW"), 2))

    def _compute_risk_score(self, anomalies: list[dict]) -> float:
        if not anomalies:
            return 0.0
        raw = sum(
            _SEVERITY_WEIGHTS.get(a.get("severity", "MEDIUM"), 0.15)
            for a in anomalies
        )
        return round(min(1.0, raw), 4)
