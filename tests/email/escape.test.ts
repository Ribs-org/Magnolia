import { describe, expect, test } from "vitest";
import { escapeHtml } from "@/lib/email/templates";

describe("escapeHtml", () => {
  test("escapes & < > \" '", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  test("escapes a mix of special characters embedded in text", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quoted'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;"
    );
  });

  test("leaves normal text unchanged", () => {
    const plain = "Hola María, tu sesión es el 6 de septiembre a las 10:00.";
    expect(escapeHtml(plain)).toBe(plain);
  });

  test("leaves an empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });
});
