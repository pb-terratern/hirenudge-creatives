import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { validateReferenceFile } from "@/server/security";
import { errorResponse, requireOwner } from "@/server/request";
import { saveUploadedReference } from "@/server/reference-store";

export async function POST(request: Request) {
  try {
    await requireOwner();
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const metadata = JSON.parse(clientPayload || "{}") as { type?: string; size?: number };
        validateReferenceFile({ name: pathname, type: metadata.type || "", size: metadata.size || 0 });
        return {
          allowedContentTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "image/png", "image/jpeg", "image/webp"],
          maximumSizeInBytes: 20_000_000,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const metadata = JSON.parse(tokenPayload || "{}") as { type?: string; notes?: string; sourceChannel?: string };
        await saveUploadedReference({ blobUrl: blob.url, title: blob.pathname.split("/").at(-1) || "Reference upload", mimeType: metadata.type, notes: metadata.notes, sourceChannel: metadata.sourceChannel });
      },
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
