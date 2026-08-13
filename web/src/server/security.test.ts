import { describe, expect, it } from "vitest";

import { assertAllowedReferenceUrl, validateReferenceFile } from "@/server/security";

describe("reference safety", () => {
  it.each(["http://127.0.0.1/private", "http://169.254.169.254/meta", "http://10.0.0.2/data", "file:///etc/passwd"])(
    "blocks private or non-web reference URL %s",
    (url) => expect(() => assertAllowedReferenceUrl(url)).toThrow(),
  );

  it("accepts a permitted private upload", () => {
    expect(validateReferenceFile({ name: "notes.pdf", type: "application/pdf", size: 2_000_000 })).toEqual({
      extension: "pdf",
      size: 2_000_000,
    });
  });

  it("rejects files over 20 MB", () => {
    expect(() => validateReferenceFile({ name: "large.pdf", type: "application/pdf", size: 20_000_001 })).toThrow(
      "Reference files must be 20 MB or smaller.",
    );
  });
});
