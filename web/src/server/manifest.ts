// Values are copied from the authoritative repository manifest into Vercel env
// during setup. Keeping them in env lets the web package deploy independently.
export const operationalSheetId = process.env.OPERATIONAL_SHEET_ID || "";
export const productTruthSheetId = process.env.PRODUCT_TRUTH_SHEET_ID || "";
export const productionFolderId = process.env.PRODUCTION_FOLDER_ID || "";

export function assertWorkspaceManifestConfigured() {
  if (!operationalSheetId || !productTruthSheetId || !productionFolderId) {
    throw new Error("Google Workspace IDs are not configured from system/drive-manifest.json.");
  }
}
