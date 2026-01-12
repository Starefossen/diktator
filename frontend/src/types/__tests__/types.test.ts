import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateAge, ChildAccount } from "../index";

describe("calculateAge", () => {
  // Mock the current year to make tests deterministic
  const CURRENT_YEAR = 2026;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(CURRENT_YEAR, 0, 12)); // January 12, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns undefined when birthYear is undefined", () => {
    expect(calculateAge(undefined)).toBeUndefined();
  });

  it("returns undefined when birthYear is 0", () => {
    expect(calculateAge(0)).toBeUndefined();
  });

  it("calculates age correctly for a child born in 2019", () => {
    expect(calculateAge(2019)).toBe(7);
  });

  it("calculates age correctly for a child born in 2016", () => {
    expect(calculateAge(2016)).toBe(10);
  });

  it("calculates age correctly for a child born in 2014", () => {
    expect(calculateAge(2014)).toBe(12);
  });

  it("calculates age correctly for edge case - born this year", () => {
    expect(calculateAge(2026)).toBe(0);
  });

  it("handles birth years in the past", () => {
    expect(calculateAge(2000)).toBe(26);
  });
});

describe("ChildAccount type", () => {
  it("birthYear is optional", () => {
    const childWithoutBirthYear: ChildAccount = {
      id: "child-1",
      email: "child@example.com",
      displayName: "Test Child",
      familyId: "family-1",
      parentId: "parent-1",
      role: "child",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      lastActiveAt: "2024-01-01T00:00:00Z",
    };

    expect(childWithoutBirthYear.birthYear).toBeUndefined();
  });

  it("birthYear can be set", () => {
    const childWithBirthYear: ChildAccount = {
      id: "child-1",
      email: "child@example.com",
      displayName: "Test Child",
      familyId: "family-1",
      parentId: "parent-1",
      role: "child",
      isActive: true,
      birthYear: 2018,
      createdAt: "2024-01-01T00:00:00Z",
      lastActiveAt: "2024-01-01T00:00:00Z",
    };

    expect(childWithBirthYear.birthYear).toBe(2018);
  });

  it("age can be calculated from birthYear", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 12));

    const child: ChildAccount = {
      id: "child-1",
      email: "child@example.com",
      displayName: "Test Child",
      familyId: "family-1",
      parentId: "parent-1",
      role: "child",
      isActive: true,
      birthYear: 2018,
      createdAt: "2024-01-01T00:00:00Z",
      lastActiveAt: "2024-01-01T00:00:00Z",
    };

    const age = calculateAge(child.birthYear);
    expect(age).toBe(8);

    vi.useRealTimers();
  });
});
