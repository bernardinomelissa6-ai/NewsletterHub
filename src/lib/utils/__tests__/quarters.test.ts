import { getQuarter } from "../quarters";

describe("getQuarter", () => {
  it("T1: janeiro a março", () => {
    expect(getQuarter(new Date("2024-01-15"))).toBe(1);
    expect(getQuarter(new Date("2024-02-28"))).toBe(1);
    expect(getQuarter(new Date("2024-03-31"))).toBe(1);
  });

  it("T2: abril a junho", () => {
    expect(getQuarter(new Date("2024-04-01"))).toBe(2);
    expect(getQuarter(new Date("2024-05-15"))).toBe(2);
    expect(getQuarter(new Date("2024-06-30"))).toBe(2);
  });

  it("T3: julho a setembro", () => {
    expect(getQuarter(new Date("2024-07-01"))).toBe(3);
    expect(getQuarter(new Date("2024-08-20"))).toBe(3);
    expect(getQuarter(new Date("2024-09-30"))).toBe(3);
  });

  it("T4: outubro a dezembro", () => {
    expect(getQuarter(new Date("2024-10-01"))).toBe(4);
    expect(getQuarter(new Date("2024-11-15"))).toBe(4);
    expect(getQuarter(new Date("2024-12-31"))).toBe(4);
  });
});
