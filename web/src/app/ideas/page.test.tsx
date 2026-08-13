// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IdeasPage from "@/app/ideas/page";

describe("Ideas page", () => {
  it("shows four Instagram ideas and removes an approved idea from the wall", () => {
    render(<IdeasPage />);

    const wall = screen.getByRole("region", { name: "Idea wall" });
    expect(within(wall).getAllByRole("article")).toHaveLength(4);
    fireEvent.click(within(wall).getAllByRole("button", { name: "Approve and validate" })[0]);
    expect(within(wall).getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("Moved to validation. Full evidence checks are running.")).toBeInTheDocument();
  });

  it("opens custom generation with all supported context inputs", () => {
    render(<IdeasPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate from context" }));

    expect(screen.getByRole("dialog", { name: "Generate ideas from context" })).toBeInTheDocument();
    expect(screen.getByLabelText("Content objective or context")).toBeInTheDocument();
    expect(screen.getByLabelText("Reference URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Reference files")).toBeInTheDocument();
  });
});
