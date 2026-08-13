export type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type ContentItem = {
  id: string;
  channel: string;
  topic: string;
  approach?: string | null;
  category: string;
  format: string;
  status: string;
  sync?: { status: "synced" | "pending" | "failed"; documentUrl?: string | null };
};

export type ScheduleSlot = {
  id: string;
  contentItemId: string;
  channel: string;
  scheduledFor: string;
  status: "suggested" | "confirmed" | "cancelled";
  content?: Pick<ContentItem, "topic" | "format"> & { production?: { googleDocUrl?: string | null } | null } | null;
};

export type Reference = {
  id: string;
  title: string;
  kind: string;
  url?: string | null;
  blobUrl?: string | null;
  notes?: string | null;
  tags: string[];
  verificationStatus: string;
  sourceChannel?: string | null;
};

export type DraftVersion = {
  id: string;
  version: number;
  body: unknown;
  revisionType: string;
  instruction?: string | null;
  createdAt?: string;
};

export type ContentDetail = {
  content: ContentItem & { selectedDraftVersionId?: string | null; finalApprovedAt?: string | null };
  drafts: DraftVersion[];
  gates: Array<{ id: string; gateId: string; decision: string; reason?: string | null }>;
  sources: Array<{ id: string; url?: string | null; sourceGroup: string; limitation?: string | null }>;
  production?: { googleDocUrl?: string | null; syncStatus?: "synced" | "pending" | "failed" } | null;
  schedule?: ScheduleSlot | null;
};

export type Health = {
  googleConnected?: boolean;
  workspaceSynced?: boolean;
  productTruthReadOnly?: boolean;
  safeToWrite?: boolean;
  [key: string]: boolean | undefined;
};

type SettingsHealthResponse = {
  health: {
    googleWorkspace?: { writesEnabled?: boolean; manifestConfigured?: boolean };
    googleIntegration?: { connected?: boolean };
  };
};

export type DraftRevision =
  | { type: "rewrite"; instruction: string }
  | { type: "recreate"; instruction?: string }
  | { type: "restore"; sourceVersionId: string };

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

async function request<T>(fetcher: Fetcher, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetcher(url, init);
  const body = await responseBody(response);
  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

function jsonRequest(method: "POST", payload: unknown, idempotencyKey: string): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
    body: JSON.stringify(payload),
  };
}

export const contentApi = {
  async listContent(fetcher: Fetcher = fetch, signal?: AbortSignal) {
    const response = await request<{ items: ContentItem[] }>(fetcher, "/api/pipeline", { signal });
    return response.items;
  },
  async listSchedule(fetcher: Fetcher = fetch, window: { start: string; end: string }, signal?: AbortSignal) {
    const query = new URLSearchParams(window);
    const response = await request<{ slots: ScheduleSlot[] }>(fetcher, `/api/calendar?${query.toString()}`, { signal });
    return response.slots;
  },
  async listReferences(fetcher: Fetcher = fetch, signal?: AbortSignal) {
    const response = await request<{ items?: Reference[]; references?: Reference[] }>(fetcher, "/api/references", { signal });
    return response.items || response.references || [];
  },
  getContent(fetcher: Fetcher, contentId: string, signal?: AbortSignal) {
    return request<{ workspace: { content: ContentItem; versions: DraftVersion[]; gates: ContentDetail["gates"]; sources: ContentDetail["sources"] } }>(fetcher, `/api/drafts/${contentId}`, { signal }).then(({ workspace }) => ({
      content: workspace.content,
      drafts: workspace.versions,
      gates: workspace.gates,
      sources: workspace.sources,
      production: workspace.content.sync ? { googleDocUrl: workspace.content.sync.documentUrl, syncStatus: workspace.content.sync.status } : null,
      schedule: null,
    }));
  },
  getHealth(fetcher: Fetcher = fetch, signal?: AbortSignal) {
    return request<SettingsHealthResponse>(fetcher, "/api/settings/health", { signal }).then(({ health }) => {
      const connected = Boolean(health.googleIntegration?.connected);
      const configured = Boolean(health.googleWorkspace?.manifestConfigured);
      return {
        googleConnected: connected,
        workspaceSynced: connected && configured,
        productTruthReadOnly: configured,
        safeToWrite: Boolean(health.googleWorkspace?.writesEnabled && connected && configured),
      };
    });
  },
  createReference(fetcher: Fetcher, input: { url: string; title?: string; notes?: string; tags?: string[] }, idempotencyKey: string) {
    return request<{ reference?: Reference } & Partial<Reference>>(fetcher, "/api/references", jsonRequest("POST", input, idempotencyKey)).then((response) => response.reference || response as Reference);
  },
  reviseDraft(fetcher: Fetcher, draftId: string, revision: DraftRevision, idempotencyKey: string) {
    return request<{ draftId: string }>(fetcher, `/api/drafts/${draftId}/revise`, jsonRequest("POST", revision, idempotencyKey));
  },
  submitDraft(fetcher: Fetcher, draftId: string, idempotencyKey: string) {
    return request<{ status: string }>(fetcher, `/api/drafts/${draftId}/submit`, jsonRequest("POST", {}, idempotencyKey));
  },
  finalApprove(fetcher: Fetcher, contentId: string, selectedDraftVersionId: string, idempotencyKey: string) {
    return request<{ finalApproved: boolean }>(fetcher, `/api/content/${contentId}/final-approve`, jsonRequest("POST", { selectedDraftVersionId }, idempotencyKey));
  },
  confirmSchedule(fetcher: Fetcher, input: { contentItemId: string; channel: string; scheduledFor: string; finalApproved: true; workspaceSynced: true }, idempotencyKey: string) {
    return request<{ status: string }>(fetcher, "/api/schedule/confirm", jsonRequest("POST", input, idempotencyKey));
  },
};

export function idempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

export function draftText(body: unknown) {
  if (typeof body === "string") return body;
  if (body && typeof body === "object") {
    const packet = body as Record<string, unknown>;
    for (const key of ["finalCopyOrScript", "body", "copy", "text"]) {
      if (typeof packet[key] === "string") return packet[key];
    }
  }
  return "";
}
