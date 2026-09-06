"""
StatisticalDetector — détection d'anomalies par modèles ML.

Utilise un vote majoritaire entre :
  - Isolation Forest
  - One-Class SVM
  - Local Outlier Factor

Une valeur est marquée comme anomalie si au moins 2 modèles sur 3 la classifient
comme un outlier.
"""
from __future__ import annotations

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.neighbors import LocalOutlierFactor

from backend.utils.logger import get_logger

logger = get_logger(__name__)

# Minimum d'échantillons pour lancer une analyse statistique significative
_MIN_SAMPLES = 5
# Seuil de vote : 2 modèles sur 3 doivent marquer la valeur comme outlier
_VOTE_THRESHOLD = 2
# Taux de contamination attendu (proportion supposée d'outliers)
_CONTAMINATION = 0.1


class StatisticalDetector:
    """Détecte les valeurs numériquement aberrantes dans une liste de montants."""

    def detect(self, amounts: list[float]) -> list[dict]:
        """
        Lance les trois modèles ML sur les *amounts* et retourne les outliers.

        Les montants sont affichés en console pour faciliter le débogage.
        """
        print(f"[StatisticalDetector] all_amounts = {amounts}")

        if len(amounts) < _MIN_SAMPLES:
            logger.info(
                "StatisticalDetector — seulement %d valeur(s) : analyse annulée (min=%d).",
                len(amounts),
                _MIN_SAMPLES,
            )
            return []

        X = np.array(amounts, dtype=float).reshape(-1, 1)
        votes = np.zeros(len(amounts), dtype=int)

        votes = self._run_isolation_forest(X, votes)
        votes = self._run_one_class_svm(X, votes)
        votes = self._run_lof(X, votes)

        anomalies = []
        for val, vote in zip(amounts, votes):
            if vote >= _VOTE_THRESHOLD:
                anomalies.append({
                    "severity": "MEDIUM",
                    "type": "statistical_outlier",
                    "message": (
                        f"Valeur statistiquement anormale : {val:.2f} "
                        f"(détectée par {vote}/3 modèles)."
                    ),
                    "value": val,
                })

        logger.info(
            "StatisticalDetector — %d outlier(s) sur %d valeur(s).",
            len(anomalies),
            len(amounts),
        )
        return anomalies

    # ── Modèles ───────────────────────────────────────────────────────────────

    def _run_isolation_forest(
        self, X: np.ndarray, votes: np.ndarray
    ) -> np.ndarray:
        try:
            model = IsolationForest(contamination=_CONTAMINATION, random_state=42)
            preds = model.fit_predict(X)
            votes += (preds == -1).astype(int)
            logger.debug("IsolationForest — outliers : %d", (preds == -1).sum())
        except Exception as exc:
            logger.warning("IsolationForest a échoué : %s", exc)
        return votes

    def _run_one_class_svm(
        self, X: np.ndarray, votes: np.ndarray
    ) -> np.ndarray:
        try:
            model = OneClassSVM(nu=_CONTAMINATION, kernel="rbf", gamma="scale")
            preds = model.fit_predict(X)
            votes += (preds == -1).astype(int)
            logger.debug("OneClassSVM — outliers : %d", (preds == -1).sum())
        except Exception as exc:
            logger.warning("OneClassSVM a échoué : %s", exc)
        return votes

    def _run_lof(self, X: np.ndarray, votes: np.ndarray) -> np.ndarray:
        try:
            n_neighbors = min(5, len(X) - 1)
            model = LocalOutlierFactor(
                n_neighbors=n_neighbors, contamination=_CONTAMINATION
            )
            preds = model.fit_predict(X)
            votes += (preds == -1).astype(int)
            logger.debug("LOF — outliers : %d", (preds == -1).sum())
        except Exception as exc:
            logger.warning("LOF a échoué : %s", exc)
        return votes
