// Shared settings of the end-to-end run (run.sh, seed.js, token.js, playwright.config.ts).
const path = require("path");

const WORK_DIR = path.resolve(__dirname, "..", ".work");

module.exports = {
  BACKEND_DIR: process.env.LAB_BACKEND_DIR || path.resolve(__dirname, "..", "..", "..", "variamos_ms_laboratory"),
  WORK_DIR,
  KEY_DIR: path.join(WORK_DIR, "keys"),
  TOKEN_FILE: path.join(WORK_DIR, "token.txt"),
  /** Session of the second researcher (P5 collaboration tests). */
  TOKEN2_FILE: path.join(WORK_DIR, "token2.txt"),
  FRONT_BUILD_DIR: path.join(WORK_DIR, "site", "variamos_laboratory"),

  BACKEND_PORT: 4610,
  FRONT_PORT: 4611,
  // Never resolved: the browser requests to these hosts are answered by the tests (page.route)
  ADMIN_URL: "http://admin.e2e.test",
  PROJECTS_URL: "http://projects.e2e.test",

  DB: {
    host: "127.0.0.1",
    port: 55433,
    database: "laboratory_test",
    user: "lab_test",
    password: "local_test_only",
    schema: "variamos_laboratory_e2e",
  },

  USER: { id: "user-dana", user: "dana", name: "Dana Researcher", email: "dana@example.org", roles: ["Researcher"], permissions: ["laboratory::access"] },
  USER2: { id: "user-eli", user: "eli", name: "Eli Collaborator", email: "eli@example.org", roles: ["Researcher"], permissions: ["laboratory::access"] },
  PROJECTS: [
    { id: "project-cars", name: "Car product line" },
    { id: "project-robots", name: "Robot product line" },
  ],
  MODEL: {
    id: "model-car-features",
    projectId: "project-cars",
    name: "Car feature model",
    // Same features in the database seed and in the vms_projects answer
    elements: [{ id: "car", name: "Car" }, { id: "gps", name: "GPS" }],
    relationships: [{ id: "car-gps", sourceId: "car", targetId: "gps" }],
  },
};
