import importlib.util
import json
import subprocess
import sys
import unittest
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT / "system" / "content-gates.json"
VALIDATOR_PATH = ROOT / "scripts" / "validate_content_system.py"

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


def load_validator_module():
    spec = importlib.util.spec_from_file_location("content_system_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise AssertionError("Validator module could not be loaded")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class GateRegistryTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(VALIDATOR_PATH.exists(), "validator must exist")
        self.assertTrue(REGISTRY_PATH.exists(), "gate registry must exist")
        self.validator = load_validator_module()
        self.registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))

    def test_registry_has_exact_gate_set_and_fields(self):
        gates = self.registry["gates"]
        self.assertEqual([f"G{i}" for i in range(10)], [gate["id"] for gate in gates])
        for gate in gates:
            self.assertEqual(REQUIRED_GATE_FIELDS, set(gate))

    def test_registry_uses_exact_outcomes_and_valid_owners(self):
        self.assertEqual(
            ["Pass", "Revise", "Block", "Not Applicable"],
            self.registry["evaluationOutcomes"],
        )
        known_owners = set(self.registry["knownOwners"])
        self.assertTrue(known_owners)
        for gate in self.registry["gates"]:
            self.assertIn(gate["owner"], known_owners)

    def test_g2_contains_complete_product_truth_inputs(self):
        g2 = next(gate for gate in self.registry["gates"] if gate["id"] == "G2")
        expected = {
            "capabilityRow",
            "truthStatus",
            "safeWording",
            "limitations",
            "evidenceSource",
            "lastVerified",
            "claimDecision",
        }
        self.assertTrue(expected.issubset(set(g2["requiredInputs"])))

    def test_valid_registry_has_no_errors(self):
        self.assertEqual([], self.validator.validate_registry(self.registry))

    def test_missing_g2_is_rejected(self):
        malformed = deepcopy(self.registry)
        malformed["gates"] = [gate for gate in malformed["gates"] if gate["id"] != "G2"]
        errors = self.validator.validate_registry(malformed)
        self.assertTrue(any("G2" in error for error in errors), errors)

    def test_duplicate_gate_id_is_rejected(self):
        malformed = deepcopy(self.registry)
        malformed["gates"][-1]["id"] = "G8"
        errors = self.validator.validate_registry(malformed)
        self.assertTrue(any("duplicate" in error.lower() for error in errors), errors)

    def test_unknown_owner_is_rejected(self):
        malformed = deepcopy(self.registry)
        malformed["gates"][0]["owner"] = "Unregistered Approver"
        errors = self.validator.validate_registry(malformed)
        self.assertTrue(any("owner" in error.lower() for error in errors), errors)

    def test_transition_after_ready_is_rejected(self):
        malformed = deepcopy(self.registry)
        malformed["automatedTransitions"].append(
            {"from": "Ready", "to": "Published", "requiredGates": ["G8"]}
        )
        errors = self.validator.validate_registry(malformed)
        self.assertTrue(any("ready" in error.lower() for error in errors), errors)

    def test_cli_passes_for_canonical_registry(self):
        result = subprocess.run(
            [sys.executable, str(VALIDATOR_PATH)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)


class GovernanceDocumentationTests(unittest.TestCase):
    @staticmethod
    def read(relative_path):
        path = ROOT / relative_path
        if not path.exists():
            raise AssertionError(f"Missing required contract: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_architect_contract_is_bounded_and_complete(self):
        text = self.read("agents/content-systems-architect.md")
        required_phrases = [
            "## Accepted input",
            "## Required output",
            "Decision",
            "Affected Roles and Gate IDs",
            "Source-of-Truth Conflicts",
            "Migration or Rollback Plan",
            "Verification Checks",
            "Residual Risks",
            "Priyansh Decision Required",
            "## Prohibited actions",
            "agent role",
            "tracker or Product Truth schema",
            "rules or sources conflict",
            "gate fails repeatedly",
            "system audit or redesign",
        ]
        for phrase in required_phrases:
            self.assertIn(phrase, text)

    def test_gate_guide_has_exactly_one_heading_per_gate(self):
        text = self.read("agents/gate-contracts.md")
        for gate_id in [f"G{i}" for i in range(10)]:
            self.assertEqual(1, text.count(f"## {gate_id} —"), gate_id)
        self.assertIn("system/content-gates.json", text)

    def test_handoff_contracts_define_every_packet(self):
        text = self.read("agents/handoff-contracts.md")
        for packet in [
            "Idea Candidate",
            "Channel Proposal",
            "Research Packet",
            "Production Packet",
            "Review Report",
            "Gate Evaluation",
            "Operations Command",
        ]:
            self.assertEqual(1, text.count(f"## {packet}"), packet)
        self.assertIn("Not Applicable", text)


class AgentRoleContractTests(unittest.TestCase):
    ROLE_FILES = [
        "content-director.md",
        "ideation-agent.md",
        "research-agent.md",
        "channel-strategy-agent.md",
        "production-agent.md",
        "editorial-trust-agent.md",
        "content-operations-bot.md",
    ]

    @staticmethod
    def role_text(filename):
        path = ROOT / "agents" / filename
        if not path.exists():
            raise AssertionError(f"Missing agent role: {filename}")
        return path.read_text(encoding="utf-8")

    def test_every_role_has_the_complete_contract_shape(self):
        required_sections = [
            "## Purpose",
            "## Accepted input",
            "## Required output",
            "## Required gates",
            "## Allowed actions",
            "## Prohibited actions",
            "## Failure behaviour",
            "## Completion criteria",
        ]
        for filename in self.ROLE_FILES:
            text = self.role_text(filename)
            for section in required_sections:
                self.assertIn(section, text, f"{filename}: {section}")
            self.assertIn("agents/handoff-contracts.md", text, filename)
            self.assertIn("system/content-gates.json", text, filename)

    def test_only_operations_has_routine_drive_mutation_permission(self):
        permission = "ROUTINE_DRIVE_MUTATION: ALLOWED"
        prohibition = "ROUTINE_DRIVE_MUTATION: PROHIBITED"
        for filename in self.ROLE_FILES:
            text = self.role_text(filename)
            if filename == "content-operations-bot.md":
                self.assertIn(permission, text)
                self.assertNotIn(prohibition, text)
            else:
                self.assertIn(prohibition, text, filename)
                self.assertNotIn(permission, text)

    def test_gate_ownership_and_human_stops_are_explicit(self):
        director = self.role_text("content-director.md")
        research = self.role_text("research-agent.md")
        editorial = self.role_text("editorial-trust-agent.md")
        operations = self.role_text("content-operations-bot.md")
        self.assertIn("G3 — STOP", director)
        self.assertIn("G8 — STOP", director)
        self.assertIn("Owns G1 and G2", research)
        self.assertIn("Owns G7", editorial)
        self.assertIn("Owns G5", operations)

    def test_operations_is_bounded_to_the_lean_schema(self):
        text = self.role_text("content-operations-bot.md")
        for header in ["Topic", "Approach", "Category", "Format", "Status", "Content Doc"]:
            self.assertIn(f"`{header}`", text)
        for state in ["Approved Topic", "Drafting", "Review", "Ready"]:
            self.assertIn(f"`{state}`", text)
        self.assertIn("Never set `Published`", text)


class ProjectEntryPointTests(unittest.TestCase):
    @staticmethod
    def read(relative_path):
        path = ROOT / relative_path
        if not path.exists():
            raise AssertionError(f"Missing project entry file: {relative_path}")
        return path.read_text(encoding="utf-8")

    def test_agents_makes_director_the_default_entry_point(self):
        text = self.read("AGENTS.md")
        self.assertIn("Content Director is the default content entry point", text)
        for role in [
            "Ideation Agent",
            "Research & Verification Agent",
            "Channel Strategy Agent",
            "Copy & Production Agent",
            "Editorial & Trust Agent",
            "Content Operations Bot",
        ]:
            self.assertIn(role, text)
        self.assertIn("bounded delegation", text)

    def test_agents_limits_architect_and_requires_validation(self):
        text = self.read("AGENTS.md")
        self.assertIn("change-triggered", text)
        self.assertIn("python3 scripts/validate_content_system.py", text)
        self.assertIn("structural change", text)

    def test_entry_docs_reference_live_contracts_without_claiming_test_complete(self):
        for relative_path in ["README.md", "system/project-handoff.md"]:
            text = self.read(relative_path)
            self.assertIn("agents/content-director.md", text, relative_path)
            self.assertIn("system/content-gates.json", text, relative_path)
            self.assertIn("controlled test", text.lower(), relative_path)
        handoff = self.read("system/project-handoff.md")
        self.assertIn("not yet complete", handoff.lower())


class ManifestContractTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads(
            (ROOT / "system" / "drive-manifest.json").read_text(encoding="utf-8")
        )

    def test_operational_and_legacy_trackers_are_distinct(self):
        drive = self.manifest["drive"]
        self.assertEqual("HireNudge Content Tracker", drive["masterSheet"]["name"])
        self.assertEqual(
            "HireNudge Weekly Social Content System",
            drive["legacyMasterSheet"]["name"],
        )
        self.assertNotEqual(drive["masterSheet"]["id"], drive["legacyMasterSheet"]["id"])
        self.assertIn("Legacy reference only", drive["legacyMasterSheet"]["operationalStatus"])

    def test_product_truth_remains_a_separate_source(self):
        drive = self.manifest["drive"]
        self.assertNotEqual(drive["masterSheet"]["id"], drive["productTruth"]["id"])
        self.assertEqual("HireNudge Product Truth", drive["productTruth"]["name"])


class ControlledTestFixtureTests(unittest.TestCase):
    def setUp(self):
        path = ROOT / "tests" / "fixtures" / "controlled-test-scenario.json"
        self.assertTrue(path.exists(), "controlled test fixture must exist")
        self.fixture = json.loads(path.read_text(encoding="utf-8"))

    def test_fixture_is_synthetic_and_pre_g3_read_only(self):
        scope = self.fixture["scope"]
        self.assertTrue(scope["employerNeutral"])
        self.assertFalse(scope["usesRealJobAsExample"])
        self.assertFalse(scope["usesPersonalData"])
        self.assertFalse(self.fixture["driveMutationAllowedBeforeG3"])

    def test_fixture_contains_the_deliberate_claim_failure(self):
        claim = self.fixture["deliberatelyBlockedClaim"].lower()
        self.assertIn("85% chance", claim)
        self.assertIn("employer's ats", claim)
        self.assertIn(self.fixture["expectedEditorialResult"], ["Block", "Revise", "Block or Revise"])
        self.assertIn("never read the number as a hiring probability", self.fixture["safeCorrection"])

    def test_fixture_records_product_truth_evidence(self):
        evidence = self.fixture["evidenceBasis"]
        self.assertGreaterEqual(len(evidence["capabilityRows"]), 3)
        self.assertGreaterEqual(len(evidence["claimDecisions"]), 4)
        self.assertIn("SRC-03", evidence["registeredSources"])


if __name__ == "__main__":
    unittest.main()
