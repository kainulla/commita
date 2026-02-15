import { describe, it, expect } from "vitest";
import { sanitizeSvgText, truncate } from "../src/utils/sanitize";

describe("sanitizeSvgText", () => {
  it("escapes ampersands", () => {
    expect(sanitizeSvgText("a & b")).toBe("a &amp; b");
  });

  it("escapes angle brackets", () => {
    expect(sanitizeSvgText("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes quotes", () => {
    expect(sanitizeSvgText('"hello"')).toBe("&quot;hello&quot;");
  });

  it("handles clean text unchanged", () => {
    expect(sanitizeSvgText("hello world")).toBe("hello world");
  });

  it("handles multiple special characters", () => {
    expect(sanitizeSvgText('<a href="x">&')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;"
    );
  });
});

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    const result = truncate("this is a very long message", 15);
    expect(result.length).toBe(15);
    expect(result).toContain("\u2026");
  });

  it("handles exact length", () => {
    expect(truncate("exact", 5)).toBe("exact");
  });
});
