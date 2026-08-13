type CapabilityTruth = {
  found: boolean;
  status?: string;
  safeWording?: string;
  evidenceSource?: string;
  lastVerified?: string;
  limitation?: string;
  conflict?: string;
};

function records(values: string[][]): Array<Record<string, string>> {
  const [headers = [], ...rows] = values;
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header.trim(), row[index]?.trim() || ""])));
}

export function resolveProductTruth(input: { module: string; capabilityValues: string[][]; conflictValues: string[][] }): CapabilityTruth {
  const moduleName = input.module.trim().toLowerCase();
  const capabilities = records(input.capabilityValues).filter((row) => row.Module?.toLowerCase() === moduleName);
  if (!capabilities.length) return { found: false };
  const capability = capabilities.find((row) => row["Truth Status"]?.toLowerCase() === "verified live") || capabilities[0];
  const conflicts = records(input.conflictValues).filter((row) => row.Module?.toLowerCase() === moduleName && row.Decision?.toLowerCase().includes("block"));
  return {
    found: true,
    status: capability["Truth Status"],
    safeWording: capability["Safe Wording"],
    evidenceSource: capability["Evidence Source"],
    lastVerified: capability["Last Verified"],
    limitation: capability.Limitations,
    conflict: conflicts.map((row) => row.Conflict || row["Existing Claim"]).filter(Boolean).join("; ") || undefined,
  };
}
