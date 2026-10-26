import { describe, expect, it } from "vitest";
import { isActive } from "./nav";

describe("isActive", () => {
  it("marks home only on the home page", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/games", "/")).toBe(false);
  });

  it("marks the catalog only on the catalog page", () => {
    expect(isActive("/games", "/games")).toBe(true);
    expect(isActive("/games/food-fight", "/games")).toBe(false);
  });

  it("marks other sections on their page and sub-pages", () => {
    expect(isActive("/extras", "/extras")).toBe(true);
    expect(isActive("/games/food-fight", "/games/food-fight")).toBe(true);
    expect(isActive("/games/food-fight/extra", "/games/food-fight")).toBe(true);
  });

  it("does not match a section that only shares a prefix", () => {
    expect(isActive("/extrasx", "/extras")).toBe(false);
    expect(isActive("/about", "/extras")).toBe(false);
  });
});
