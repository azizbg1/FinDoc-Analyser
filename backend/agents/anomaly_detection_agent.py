"""
Compatibility shim — délègue à l'implémentation modulaire.
L'orchestrateur importe toujours depuis ce module.
"""
from backend.agents.anomaly_detection.anomaly_agent import AnomalyDetectionAgent

__all__ = ["AnomalyDetectionAgent"]
