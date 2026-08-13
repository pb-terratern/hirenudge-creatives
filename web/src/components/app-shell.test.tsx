// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/app-shell";

describe("App shell", () => {
  it("provides persistent wayfinding to every major section", () => {
    render(<AppShell current="ideas"><div>Content</div></AppShell>);
    const nav = screen.getByRole("navigation", { name: "Primary" });
    for (const label of ["Ideas", "Pipeline", "Calendar", "References", "Settings"]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getByRole("link", { name: "Ideas" })).toHaveAttribute("aria-current", "page");
  });
});
