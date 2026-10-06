import { describe, expect, test } from "vitest";
import { colorText } from "./misc";

describe("colorText", () => {
  test("wraps colored segments in a span", () => {
    expect(colorText("{green}Hello")).toBe(
      '<span style="color: green;">Hello</span>'
    );
  });

  test("handles multiple colored segments", () => {
    expect(colorText("{red}Error {white}at {yellow}line 1")).toBe(
      '<span style="color: red;">Error </span><span style="color: white;">at </span><span style="color: yellow;">line 1</span>'
    );
  });

  test("escapes HTML in user-controlled text", () => {
    expect(colorText('{green}<img src=x onerror="alert(1)">')).toBe(
      '<span style="color: green;">&lt;img src=x onerror=&quot;alert(1)&quot;&gt;</span>'
    );
  });

  test("escapes ampersands and quotes", () => {
    expect(colorText("{white}Tom & Jerry's \"hi\"")).toBe(
      '<span style="color: white;">Tom &amp; Jerry&#39;s &quot;hi&quot;</span>'
    );
  });

  test("leaves non-color brace patterns untouched", () => {
    expect(colorText("{red orange} text")).toBe("{red orange} text");
  });
});