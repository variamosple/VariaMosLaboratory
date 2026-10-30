import { flatten } from "./SideBySideTab";

test("leaf paths of the runs, arrays kept whole (LAB-RP-04)", () => {
    expect([...flatten({ scenarios: { Car: { models: ["h1"], solvers: { z3: { version: "4.13.0" } } } }, metrics: [] }).entries()]).toEqual([
        ["scenarios/Car/models", ["h1"]],
        ["scenarios/Car/solvers/z3/version", "4.13.0"],
        ["metrics", []],
    ]);
});
