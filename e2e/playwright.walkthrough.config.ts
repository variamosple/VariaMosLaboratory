import base from "./playwright.config";

// The functional walkthrough: one long journey through the whole interface, with a report.
// A blocked action fails its step after 15 s instead of holding the whole journey.
export default {
  ...base,
  testDir: "./walkthrough",
  timeout: 20 * 60_000,
  reporter: [["list"]],
  use: { ...base.use, actionTimeout: 15_000 },
};
