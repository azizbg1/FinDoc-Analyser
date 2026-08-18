"""
RuleBasedDetector — détection d'anomalies par règles métier.

Règles implémentées :
  1. Champs obligatoires manquants
  2. Cohérence Total TTC = Sous-total HT + TVA
  3. Cohérence des totaux de ligne (qté × PU = total ligne)
  4. Montants négatifs, nuls, TVA absente
  5. Format du numéro de facture
"""
from __future__ import annotations

import re
from typing import Any, Optional

from backend.utils.logger import get_logger

logger = get_logger(__name__)

# ── Parsing des nombres au format français / international ───────────────────

_CURRENCY_RE = re.compile(r"[€$£]")
_WHITESPACE_THOUSAND_RE = re.compile(r"[\s \xa0](?=\d{3}(?:[^.,]|$))")
_PERIOD_THOUSAND_RE = re.compile(r"\.(?=\d{3}(?:[^.,]|$))")


def _parse_amount(raw: str) -> Optional[float]:
    """
    Convertit "1 234,56" / "1.234,56" / "1234.56" en float.
    Retourne None si la conversion échoue.
    """
    s = _CURRENCY_RE.sub("", raw).strip()
    # Cas français : séparateur décimal = virgule
    if re.search(r",\d{1,2}$", s):
        s = _WHITESPACE_THOUSAND_RE.sub("", s)
        s = _PERIOD_THOUSAND_RE.sub("", s)
        s = s.replace(",", ".")
    else:
        # Cas anglosaxon : "1,234.56"
        s = re.sub(r",(?=\d{3})", "", s)
    try:
        return float(re.sub(r"\s", "", s))
    except ValueError:
        return None


def _extract_labeled_amount(text: str, labels: list[str]) -> Optional[float]:
    """
    Cherche le premier montant précédé par l'un des labels dans le texte.
    Gère les formes "Label : montant" ou "Label montant".
    """
    label_pat = "|".join(re.escape(l) for l in labels)
    pattern = re.compile(
        rf"(?:{label_pat})\s*[:\-]?\s*([-]?\d[\d\s.,]*(?:[.,]\d{{1,2}})?)",
        re.IGNORECASE,
    )
    for match in pattern.finditer(text):
        val = _parse_amount(match.group(1))
        if val is not None:
            return val
    return None


def _all_labeled_amounts(text: str, labels: list[str]) -> list[float]:
    """Retourne tous les montants associés à l'un des labels."""
    label_pat = "|".join(re.escape(l) for l in labels)
    pattern = re.compile(
        rf"(?:{label_pat})\s*[:\-]?\s*([-]?\d[\d\s.,]*(?:[.,]\d{{1,2}})?)",
        re.IGNORECASE,
    )
    return [v for m in pattern.finditer(text) if (v := _parse_amount(m.group(1))) is not None]


# ── Champs obligatoires par type de document ─────────────────────────────────

_REQUIRED_FIELDS: dict[str, dict[str, list[str]]] = {
    "facture": {
        "numéro de facture": [
            "numéro", "n°", "num.", "facture n", "invoice no", "ref.", "référence",
        ],
        "date": ["date", "émis le", "issued", "le "],
        "client": ["client", "destinataire", "acheteur", "bill to", "facturer à"],
        "sous-total HT": [
            "sous-total", "sous total", "total ht", "hors taxe", "subtotal", "base ht",
        ],
        "TVA": ["tva", "t.v.a.", "taxe", "vat", "montant tva"],
        "total TTC": [
            "total ttc", "net à payer", "montant total", "total tva incluse",
            "montant dû", "amount due",
        ],
    },
    "bon de commande": {
        "numéro de commande": [
            "commande n°", "bon de commande", "purchase order", "po n°", "order no",
        ],
        "date": ["date", "le "],
        "sous-total": ["sous-total", "total ht", "subtotal"],
        "total": ["total", "montant total"],
    },
    "reçu": {
        "date": ["date", "le "],
        "montant": ["montant", "total", "payé", "reçu"],
    },
}

# Format valide d'un numéro de facture : FAC-2026-00125
_VALID_INVOICE_NUM_RE = re.compile(r"^[A-Z]{2,6}-\d{4}-\d{3,6}$")

# Recherche d'un numéro de facture dans le texte
_INVOICE_NUM_SEARCH_RE = re.compile(
    r"(?:numéro|n°|num\.?|facture\s*n\.?|invoice\s*(?:no|n°|#)?)\s*[:\-]?\s*([A-Z0-9\-/]{4,20})",
    re.IGNORECASE,
)


class RuleBasedDetector:
    """Détecte les anomalies basées sur des règles métier financières."""

    def detect(self, text: str, doc_type: str) -> list[dict[str, Any]]:
        """Applique toutes les règles et retourne la liste des anomalies détectées."""
        anomalies: list[dict[str, Any]] = []
        anomalies += self._check_required_fields(text, doc_type)
        anomalies += self._check_total_consistency(text)
        anomalies += self._check_line_totals(text)
        anomalies += self._check_suspicious_amounts(text)
        anomalies += self._check_invoice_number_format(text)
        logger.info("RuleBasedDetector — %d anomalie(s) détectée(s)", len(anomalies))
        return anomalies

    # ── Règle 1 : Champs obligatoires ────────────────────────────────────────

    def _check_required_fields(self, text: str, doc_type: str) -> list[dict]:
        fields = _REQUIRED_FIELDS.get(doc_type, {})
        text_lower = text.lower()
        anomalies = []
        for field_name, keywords in fields.items():
            if not any(kw in text_lower for kw in keywords):
                anomalies.append({
                    "severity": "HIGH",
                    "type": "missing_field",
                    "message": f"Champ obligatoire absent : « {field_name} ».",
                    "value": field_name,
                })
        return anomalies

    # ── Règle 2 : Cohérence Total TTC = HT + TVA ─────────────────────────────

    def _check_total_consistency(self, text: str) -> list[dict]:
        ht = _extract_labeled_amount(
            text,
            ["sous-total", "sous total", "total ht", "hors taxe", "base ht", "subtotal"],
        )
        tva = _extract_labeled_amount(
            text,
            ["tva", "t.v.a.", "taxe", "vat", "montant tva", "montant de la tva"],
        )
        ttc = _extract_labeled_amount(
            text,
            ["total ttc", "net à payer", "montant total", "total tva incluse", "montant dû"],
        )

        print(f"\n[RuleDetector] === _check_total_consistency ===")
        print(f"[RuleDetector] HT  = {ht}")
        print(f"[RuleDetector] TVA = {tva}")
        print(f"[RuleDetector] TTC = {ttc}")

        if ht is not None and tva is not None and ttc is not None:
            expected = round(ht + tva, 2)
            print(f"[RuleDetector] Expected TTC = {expected}")
            print(f"[RuleDetector] Found TTC    = {ttc}")
            print(f"[RuleDetector] Difference   = {abs(expected - ttc):.2f}")
            if abs(expected - ttc) > 0.02:
                print(f"[RuleDetector] → ANOMALIE total_inconsistency détectée !")
                return [{
                    "severity": "HIGH",
                    "type": "total_inconsistency",
                    "message": (
                        f"Le total TTC est incohérent : {ht:.2f} (HT) + {tva:.2f} (TVA)"
                        f" = {expected:.2f}, mais le document indique {ttc:.2f}."
                    ),
                    "value": {"ht": ht, "tva": tva, "expected_ttc": expected, "found_ttc": ttc},
                }]
            else:
                print(f"[RuleDetector] → Total TTC cohérent, pas d'anomalie.")
        else:
            print(f"[RuleDetector] → Montants incomplets (HT/TVA/TTC non tous présents) — règle ignorée.")
        return []

    # ── Règle 3 : Total ligne = qté × prix unitaire ───────────────────────────

    def _check_line_totals(self, text: str) -> list[dict]:
        """
        Détecte les lignes de type "10  810,00  8 100,00" où qté × PU ≠ total.
        Cherche uniquement sur des lignes complètes pour limiter les faux positifs.
        """
        # Chaque ligne candidate : trois colonnes numériques séparées
        line_re = re.compile(
            r"^[ \t]*(\d{1,4})\s{2,}([\d.,\s]{3,15})\s{2,}([\d.,\s]{3,15})\s*$",
            re.MULTILINE,
        )
        anomalies = []
        seen: set[str] = set()

        for m in line_re.finditer(text):
            qty = _parse_amount(m.group(1))
            unit = _parse_amount(m.group(2).strip())
            total = _parse_amount(m.group(3).strip())

            if qty is None or unit is None or total is None:
                continue
            if qty <= 0 or unit <= 0 or total <= 0:
                continue
            # Ignorer les très grandes quantités (probablement pas des qté)
            if qty > 10_000:
                continue

            expected = round(qty * unit, 2)
            relative_error = abs(expected - total) / max(total, 1)
            if relative_error > 0.02:
                key = f"{qty}|{unit}|{total}"
                if key not in seen:
                    seen.add(key)
                    anomalies.append({
                        "severity": "MEDIUM",
                        "type": "line_total_error",
                        "message": (
                            f"Total de ligne incohérent : {qty} × {unit:.2f} = {expected:.2f},"
                            f" mais {total:.2f} est indiqué."
                        ),
                        "value": {
                            "qty": qty,
                            "unit_price": unit,
                            "expected": expected,
                            "found": total,
                        },
                    })

        return anomalies[:5]  # plafond pour limiter le bruit OCR

    # ── Règle 4 : Montants suspects ───────────────────────────────────────────

    def _check_suspicious_amounts(self, text: str) -> list[dict]:
        anomalies: list[dict] = []

        # Montants négatifs
        neg_re = re.compile(r"-\s*(\d[\d\s.,]+)\s*(?:€|EUR|DT)?")
        for m in neg_re.finditer(text):
            val = _parse_amount(m.group(0))
            if val is not None and val < 0:
                anomalies.append({
                    "severity": "HIGH",
                    "type": "negative_amount",
                    "message": f"Montant négatif détecté : {val}.",
                    "value": val,
                })

        # Montants nuls explicites
        zero_re = re.compile(r"\b0[,.]00\b|\b0,0\b|\b0\.0\b")
        if zero_re.search(text):
            anomalies.append({
                "severity": "LOW",
                "type": "zero_amount",
                "message": "Montant nul (0,00) détecté — possible donnée manquante.",
                "value": 0,
            })

        # TVA absente alors qu'un total est présent
        text_lower = text.lower()
        has_total = any(kw in text_lower for kw in ["total", "montant"])
        has_tva = any(kw in text_lower for kw in ["tva", "taxe", "t.v.a.", "vat"])
        if has_total and not has_tva:
            anomalies.append({
                "severity": "MEDIUM",
                "type": "missing_tva",
                "message": "TVA absente alors qu'un total est présent dans le document.",
                "value": None,
            })

        # Total inférieur au sous-total
        ht = _extract_labeled_amount(
            text, ["sous-total", "total ht", "base ht", "subtotal"]
        )
        ttc = _extract_labeled_amount(
            text, ["total ttc", "montant total", "net à payer"]
        )
        if ht is not None and ttc is not None and ttc < ht:
            anomalies.append({
                "severity": "HIGH",
                "type": "total_less_than_subtotal",
                "message": (
                    f"Le total ({ttc:.2f}) est inférieur au sous-total ({ht:.2f})."
                ),
                "value": {"total": ttc, "subtotal": ht},
            })

        return anomalies

    # ── Règle 5 : Format numéro de facture ───────────────────────────────────

    def _check_invoice_number_format(self, text: str) -> list[dict]:
        for m in _INVOICE_NUM_SEARCH_RE.finditer(text):
            number = m.group(1).strip().upper()
            if not _VALID_INVOICE_NUM_RE.match(number):
                return [{
                    "severity": "LOW",
                    "type": "invoice_number_format",
                    "message": (
                        f"Format du numéro de facture non standard : « {number} »."
                        " Format attendu : FAC-2026-00125."
                    ),
                    "value": number,
                }]
        return []
