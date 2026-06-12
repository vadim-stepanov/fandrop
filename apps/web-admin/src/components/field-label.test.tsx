import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FieldCharCount, FieldHeader, labelText } from "./field-label";

// Frontend unit layer (Vitest + React Testing Library, jsdom). Covers the
// admin form chrome: the live character counter and the dirty-field marker.
describe("FieldCharCount", () => {
  it("renders current/max and stays muted below the cap", () => {
    render(<FieldCharCount current={10} max={80} />);
    const el = screen.getByText("10/80");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("text-muted-foreground");
    expect(el.className).not.toContain("amber");
  });

  it("turns amber at the cap", () => {
    render(<FieldCharCount current={80} max={80} />);
    expect(screen.getByText("80/80").className).toContain("amber");
  });
});

describe("FieldHeader", () => {
  it("renders the label plus a counter when current/max are provided", () => {
    render(<FieldHeader label="Title" htmlFor="t" current={5} max={160} />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("5/160")).toBeInTheDocument();
  });

  it("omits the counter when no max is given", () => {
    render(<FieldHeader label="Slug" />);
    expect(screen.getByText("Slug")).toBeInTheDocument();
    expect(screen.queryByText(/\d+\/\d+/)).toBeNull();
  });
});

describe("labelText", () => {
  it("appends a dirty marker (*) only when the field changed", () => {
    const { rerender } = render(<span>{labelText("Name", false)}</span>);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText("*")).toBeNull();

    rerender(<span>{labelText("Name", true)}</span>);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});

// Snapshot test: locks the rendered markup of the field header (label + char
// counter). Inline so the structure is reviewed in-diff; explicit assertions
// above still guard behaviour — the snapshot just catches accidental markup drift.
describe("FieldHeader markup", () => {
  it("matches the rendered structure", () => {
    const { container } = render(
      <FieldHeader label="Title" htmlFor="title" current={120} max={160} />,
    );
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div
        class="mb-1 flex items-baseline justify-between gap-2"
      >
        <label
          class="flex items-center gap-2 text-sm font-medium leading-none select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-foreground"
          data-slot="label"
          for="title"
        >
          Title
        </label>
        <span
          class="text-xs tabular-nums text-muted-foreground"
        >
          120
          /
          160
        </span>
      </div>
    `);
  });
});
