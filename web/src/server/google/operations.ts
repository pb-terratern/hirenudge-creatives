import { google, type docs_v1, type drive_v3, type sheets_v4 } from "googleapis";

import type { Channel } from "@/domain/content-system";
import { operationalSheetId, productTruthSheetId, productionFolderId } from "@/server/manifest";
import { resolveProductTruth } from "@/server/google/product-truth";
import { sheetRowForContent, type TrackerStatus } from "@/server/google/workspace";

const tabs: Record<Channel, string> = { linkedin: "LinkedIn", instagram: "Instagram", x: "X", youtube: "YouTube" };
export function trackerTabForChannel(channel: Channel): string { return tabs[channel]; }

export function extractSheetRowNumber(updatedRange: string): number {
  const match = updatedRange.match(/![A-Z]+(\d+):[A-Z]+(\d+)$/);
  if (!match || match[1] !== match[2]) throw new Error("Expected a single appended tracker row.");
  return Number(match[1]);
}

export type GoogleClients = { sheets: sheets_v4.Sheets; docs: docs_v1.Docs; drive: drive_v3.Drive };
export function createGoogleClients(refreshToken: string, clientId: string, clientSecret: string, redirectUri: string): GoogleClients {
  const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth.setCredentials({ refresh_token: refreshToken });
  return { sheets: google.sheets({ version: "v4", auth: oauth }), docs: google.docs({ version: "v1", auth: oauth }), drive: google.drive({ version: "v3", auth: oauth }) };
}

export async function createApprovedWorkspaceArtifacts(input: {
  clients: GoogleClients;
  contentId: string;
  channel: Channel;
  topic: string;
  approach: string;
  category: string;
  format: string;
  documentBody: string;
}): Promise<{ googleDocId: string; googleDocUrl: string; row: number; metadataId?: number }> {
  const { data: doc } = await input.clients.docs.documents.create({ requestBody: { title: `${trackerTabForChannel(input.channel)} · ${input.topic}` } });
  if (!doc.documentId) throw new Error("Google Docs did not return a document ID.");
  await input.clients.docs.documents.batchUpdate({ documentId: doc.documentId, requestBody: { requests: [{ insertText: { location: { index: 1 }, text: input.documentBody } }] } });
  await input.clients.drive.files.update({ fileId: doc.documentId, addParents: productionFolderId, fields: "id,parents" });
  const googleDocUrl = `https://docs.google.com/document/d/${doc.documentId}/edit`;
  const tab = trackerTabForChannel(input.channel);
  const append = await input.clients.sheets.spreadsheets.values.append({ spreadsheetId: operationalSheetId, range: `${tab}!A:F`, valueInputOption: "USER_ENTERED", insertDataOption: "INSERT_ROWS", requestBody: { values: [sheetRowForContent({ ...input, status: "Approved Topic", contentDocUrl: googleDocUrl })] } });
  const row = extractSheetRowNumber(append.data.updates?.updatedRange || "");
  const metadata = await input.clients.sheets.spreadsheets.batchUpdate({ spreadsheetId: operationalSheetId, requestBody: { requests: [{ createDeveloperMetadata: { developerMetadata: { location: { dimensionRange: { sheetId: await resolveSheetId(input.clients.sheets, tab), dimension: "ROWS", startIndex: row - 1, endIndex: row } }, visibility: "PROJECT", metadataKey: "hirenudge_content_id", metadataValue: input.contentId } } }] } });
  return { googleDocId: doc.documentId, googleDocUrl, row, metadataId: metadata.data.replies?.[0]?.createDeveloperMetadata?.developerMetadata?.metadataId ?? undefined };
}

async function resolveSheetId(sheets: sheets_v4.Sheets, title: string): Promise<number> {
  const response = await sheets.spreadsheets.get({ spreadsheetId: operationalSheetId, fields: "sheets.properties" });
  const sheetId = response.data.sheets?.find((sheet) => sheet.properties?.title === title)?.properties?.sheetId;
  if (sheetId === null || sheetId === undefined) throw new Error(`Tracker tab ${title} was not found.`);
  return sheetId;
}

export async function updateTrackerStatusByMetadata(input: { sheets: sheets_v4.Sheets; contentId: string; row: [string, string, string, string, TrackerStatus, string] }) {
  return input.sheets.spreadsheets.values.batchUpdateByDataFilter({ spreadsheetId: operationalSheetId, requestBody: { valueInputOption: "USER_ENTERED", data: [{ dataFilter: { developerMetadataLookup: { metadataKey: "hirenudge_content_id", metadataValue: input.contentId, visibility: "PROJECT" } }, majorDimension: "ROWS", values: [input.row] }] } });
}

export async function readProductTruthForModule(clients: GoogleClients, module: string) {
  const [capabilities, conflicts] = await Promise.all([
    clients.sheets.spreadsheets.values.get({ spreadsheetId: productTruthSheetId, range: "Capabilities!A:I" }),
    clients.sheets.spreadsheets.values.get({ spreadsheetId: productTruthSheetId, range: "'Claims & Conflicts'!A:G" }),
  ]);
  return resolveProductTruth({ module, capabilityValues: (capabilities.data.values || []) as string[][], conflictValues: (conflicts.data.values || []) as string[][] });
}
