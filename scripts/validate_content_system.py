#!/usr/bin/env python3
"""Validate the declarative HireNudge content-system gate registry."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = ROOT / "system" / "content-gates.json"
EXPECTED_GATE_IDS = [f"G{index}" for index in range(10)]
EXPECTED_OUTCOMES = ["Pass", "Revise", "Block", "Not Applicable"]
EXPECTED_STATES = ["Approved Topic", "Drafting", "Review", "Ready"]
REQUIRED_GATE_FIELDS = {
    "id",
    "name",
    "owner",
    "appliesWhen",
    "checkpoint",
    "requiredInputs",
    "passCriteria",
    "failureAction",
    "allowedNextState",
}


def load_registry(path: Path) -> dict[str, Any]:
    """Load one JSON gate registry from disk."""

    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError("Registry root must be an object")
    return data


def _validate_allowed_state(value: Any, states: set[str], gate_id: str) -> list[str]:
    if value is None:
        return []
    values = value if isinstance(value, list) else [value]
    if not all(isinstance(item, str) for item in values):
        return [f"{gate_id} allowedNextState must be null, a string or a list of strings"]
    unknown = [item for item in values if item not in states]
    return [f"{gate_id} has unknown allowedNextState: {item}" for item in unknown]


def validate_registry(registry: dict[str, Any]) -> list[str]:
    """Return semantic validation errors for a registry, or an empty list."""

    errors: list[str] = []
    required_top_level = {
        "schemaVersion",
        "evaluationOutcomes",
        "workflowStates",
        "automatedTransitions",
        "knownOwners",
        "gates",
    }
    missing_top = sorted(required_top_level - set(registry))
    if missing_top:
        errors.append(f"Missing top-level fields: {', '.join(missing_top)}")

    outcomes = registry.get("evaluationOutcomes")
    if outcomes != EXPECTED_OUTCOMES:
        errors.append(f"evaluationOutcomes must be exactly {EXPECTED_OUTCOMES}")

    states = registry.get("workflowStates")
    if states != EXPECTED_STATES:
        errors.append(f"workflowStates must be exactly {EXPECTED_STATES}")
    state_set = set(states) if isinstance(states, list) else set()

    owners = registry.get("knownOwners")
    owner_set = set(owners) if isinstance(owners, list) else set()
    if not owner_set or not all(isinstance(owner, str) and owner for owner in owner_set):
        errors.append("knownOwners must be a non-empty list of names")

    gates = registry.get("gates")
    if not isinstance(gates, list):
        errors.append("gates must be a list")
        gates = []

    gate_ids = [gate.get("id") for gate in gates if isinstance(gate, dict)]
    if len(gate_ids) != len(set(gate_ids)):
        errors.append("Gate IDs contain a duplicate")
    missing_gate_ids = [gate_id for gate_id in EXPECTED_GATE_IDS if gate_id not in gate_ids]
    extra_gate_ids = [gate_id for gate_id in gate_ids if gate_id not in EXPECTED_GATE_IDS]
    if missing_gate_ids:
        errors.append(f"Missing required Gate IDs: {', '.join(missing_gate_ids)}")
    if extra_gate_ids:
        errors.append(f"Unknown Gate IDs: {', '.join(str(item) for item in extra_gate_ids)}")
    if gate_ids != EXPECTED_GATE_IDS:
        errors.append("Gates must appear once in G0 through G9 order")

    for position, gate in enumerate(gates):
        if not isinstance(gate, dict):
            errors.append(f"Gate at position {position} must be an object")
            continue
        gate_id = str(gate.get("id", f"position {position}"))
        missing_fields = sorted(REQUIRED_GATE_FIELDS - set(gate))
        extra_fields = sorted(set(gate) - REQUIRED_GATE_FIELDS)
        if missing_fields:
            errors.append(f"{gate_id} is missing fields: {', '.join(missing_fields)}")
        if extra_fields:
            errors.append(f"{gate_id} has unsupported fields: {', '.join(extra_fields)}")
        if gate.get("owner") not in owner_set:
            errors.append(f"{gate_id} has unknown owner: {gate.get('owner')}")
        for list_field in ("requiredInputs", "passCriteria", "failureAction"):
            value = gate.get(list_field)
            if not isinstance(value, list) or not value or not all(
                isinstance(item, str) and item for item in value
            ):
                errors.append(f"{gate_id} {list_field} must be a non-empty list of strings")
        for text_field in ("name", "appliesWhen", "checkpoint"):
            if not isinstance(gate.get(text_field), str) or not gate[text_field]:
                errors.append(f"{gate_id} {text_field} must be a non-empty string")
        errors.extend(_validate_allowed_state(gate.get("allowedNextState"), state_set, gate_id))

    g2 = next((gate for gate in gates if isinstance(gate, dict) and gate.get("id") == "G2"), None)
    product_truth_inputs = {
        "capabilityRow",
        "truthStatus",
        "safeWording",
        "limitations",
        "evidenceSource",
        "lastVerified",
        "claimDecision",
    }
    if g2 is None:
        errors.append("G2 Product Truth gate is required")
    elif not product_truth_inputs.issubset(set(g2.get("requiredInputs", []))):
        missing = sorted(product_truth_inputs - set(g2.get("requiredInputs", [])))
        errors.append(f"G2 is missing Product Truth inputs: {', '.join(missing)}")

    transitions = registry.get("automatedTransitions")
    if not isinstance(transitions, list):
        errors.append("automatedTransitions must be a list")
        transitions = []
    allowed_pairs = {
        (None, "Approved Topic"),
        ("Approved Topic", "Drafting"),
        ("Drafting", "Review"),
        ("Review", "Ready"),
    }
    gate_id_set = set(EXPECTED_GATE_IDS)
    for transition in transitions:
        if not isinstance(transition, dict):
            errors.append("Every automated transition must be an object")
            continue
        source = transition.get("from")
        destination = transition.get("to")
        if source == "Ready" or destination not in state_set or (source, destination) not in allowed_pairs:
            errors.append(
                f"Automated transition {source!r} to {destination!r} is invalid; nothing may advance after Ready"
            )
        required_gates = transition.get("requiredGates")
        if not isinstance(required_gates, list) or not required_gates:
            errors.append(f"Transition {source!r} to {destination!r} requires gate IDs")
        else:
            unknown = [gate_id for gate_id in required_gates if gate_id not in gate_id_set]
            if unknown:
                errors.append(
                    f"Transition {source!r} to {destination!r} has unknown gates: {', '.join(unknown)}"
                )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_REGISTRY)
    args = parser.parse_args()
    try:
        registry = load_registry(args.path)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"INVALID: {exc}")
        return 1
    errors = validate_registry(registry)
    if errors:
        for error in errors:
            print(f"INVALID: {error}")
        return 1
    print(f"VALID: {args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
