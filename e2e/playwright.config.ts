import { defineConfig } from "@playwright/test";
import path from "path";

const env = require("./support/env");

export default defineConfig({
  testDir: "./tests",
  // One database for the run: tests share it, so they run one after the other
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: path.join(env.WORK_DIR, "results"),
  reporter: [["list"], ["html", { outputFolder: path.join(env.WORK_DIR, "report"), open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${env.FRONT_PORT}/variamos_laboratory/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      // The system Chromium: no browser download
      executablePath: process.env.E2E_CHROMIUM || "/usr/bin/chromium",
    },
  },
  webServer: [
    {
      command: "node dist/Domain/Init/StartServiceUseCases.js",
      cwd: env.BACKEND_DIR,
      url: `http://127.0.0.1:${env.BACKEND_PORT}/health`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        PORT: String(env.BACKEND_PORT),
        DB_HOST: env.DB.host,
        DB_PORT: String(env.DB.port),
        DB_DATABASE: env.DB.database,
        DB_USER: env.DB.user,
        DB_PASSWORD: env.DB.password,
        DB_SCHEMA: env.DB.schema,
        // The test database has no TLS
        DB_SSL: "false",
        VARIAMOS_PUBLIC_KEY_PATH: path.join(env.KEY_DIR, "public.pem"),
        VARIAMOS_PRIVATE_KEY_PATH: path.join(env.KEY_DIR, "private.pem"),
        // P2 runs on the mock Reasoning gateway: each solver job takes 3 s
        MOCK_REASONING_DURATION_MS: "3000",
        LAB_RUN_POLL_INTERVAL_MS: "200",
      },
    },
    {
      command: `python3 -m http.server ${env.FRONT_PORT} --bind 127.0.0.1 --directory ${path.dirname(env.FRONT_BUILD_DIR)}`,
      url: `http://127.0.0.1:${env.FRONT_PORT}/variamos_laboratory/`,
      reuseExistingServer: false,
      stdout: "ignore",
      stderr: "ignore",
    },
  ],
});
