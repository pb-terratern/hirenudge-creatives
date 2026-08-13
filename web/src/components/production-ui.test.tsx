// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CalendarClient, DraftClient, PipelineClient, ReferencesClient, SettingsClient } from "@/components/production-ui";

const item = {
  id: "content-1", channel: "linkedin", topic: "Remote-ready proof", approach: "Show observable async proof.", category: "Global applications", format: "Text post", status: "ready", sync: { status: "synced" as const, documentUrl: "https://docs.google.com/document/d/test/edit" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("production UI clients", () => {
  it("renders API-backed pipeline content and reports a failed load", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ items: [item] })));
    render(<PipelineClient />);
    expect(screen.getByText("Loading pipeline…")).toBeInTheDocument();
    expect(await screen.findByText("Remote-ready proof")).toBeInTheDocument();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ error: "Tracker offline" }, 503)));
    render(<PipelineClient />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Tracker offline");
  });

  it("confirms a suggested calendar slot through the schedule API", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ slots: [{ id: "slot-1", contentItemId: "content-1", channel: "linkedin", scheduledFor: "2026-08-18T04:30:00.000Z", status: "suggested", content: { topic: "Remote-ready proof", format: "Text post" } }] }))
      .mockResolvedValueOnce(json({ status: "confirmed" }));
    vi.stubGlobal("fetch", fetcher);
    render(<CalendarClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Confirm slot" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledWith("/api/schedule/confirm", expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Confirm slot" })).not.toBeInTheDocument());
  });

  it("saves a reference URL through the references API", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ references: [] }))
      .mockResolvedValueOnce(json({ reference: { id: "ref-1", title: "Remote guide", kind: "url", url: "https://example.com/guide", tags: [], verificationStatus: "unverified" } }));
    vi.stubGlobal("fetch", fetcher);
    render(<ReferencesClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Add reference" }));
    fireEvent.change(screen.getByLabelText("Reference URL"), { target: { value: "https://example.com/guide" } });
    fireEvent.click(screen.getByRole("button", { name: "Save URL" }));

    expect(await screen.findByText("Reference saved.")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/references", expect.objectContaining({ method: "POST" }));
  });

  it("exposes the API-backed draft workflow controls and records final approval", async () => {
    const workspace = { content: item, versions: [{ id: "draft-1", version: 1, body: { finalCopyOrScript: "A specific applicant decision." }, revisionType: "initial" }], gates: [], sources: [] };
    const fetcher = vi.fn().mockResolvedValueOnce(json({ workspace })).mockResolvedValueOnce(json({ finalApproved: true }));
    vi.stubGlobal("fetch", fetcher);
    render(<DraftClient contentId="content-1" />);

    expect(await screen.findByDisplayValue("A specific applicant decision.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rewrite" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Recreate" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Submit for review" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Restore version 1" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Final approve" }));

    expect(await screen.findByText("Final approval recorded.")).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/content/content-1/final-approve", expect.objectContaining({ method: "POST" }));
    expect(screen.getByRole("link", { name: "Open production Doc" })).toHaveAttribute("href", "https://docs.google.com/document/d/test/edit");
  });

  it("shows connection and safety health returned by the settings endpoint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ health: { database: { configured: true }, googleWorkspace: { writesEnabled: false, manifestConfigured: true }, googleIntegration: { connected: true } } })));
    render(<SettingsClient />);

    expect(await screen.findByText("Writes paused")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Google Workspace" })).toBeInTheDocument();
  });

  it("offers the Workspace consent flow when Google is disconnected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ health: { database: { configured: true }, googleWorkspace: { writesEnabled: false, manifestConfigured: true }, googleIntegration: { connected: false } } })));
    render(<SettingsClient />);

    expect(await screen.findByRole("link", { name: "Connect Google Workspace" })).toHaveAttribute("href", "/api/integrations/google/connect");
  });
});
