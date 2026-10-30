// Recreates the platform tables the Laboratory reads (as vms_projects owns them) with
// two users, two projects, one language and one model, and drops the Laboratory schema of the run.
const fs = require("fs");
const path = require("path");
const env = require("./env");

const { Client } = require(path.join(env.BACKEND_DIR, "node_modules", "pg"));

async function main() {
  const client = new Client({ ...env.DB });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${env.DB.schema} CASCADE`);
    await client.query("DROP SCHEMA IF EXISTS variamos CASCADE");
    await client.query(fs.readFileSync(path.join(env.BACKEND_DIR, "test-support", "platform_stub.sql"), "utf8"));

    const { USER, USER2, PROJECTS, MODEL } = env;
    for (const user of [USER, USER2]) {
      await client.query(`INSERT INTO variamos."user" (id, "user", name, email) VALUES ($1, $2, $3, $4)`, [user.id, user.user, user.name, user.email]);
    }
    for (const project of PROJECTS) {
      await client.query("INSERT INTO variamos.project (id, owner_id, name) VALUES ($1, $2, $3)", [project.id, USER.id, project.name]);
    }
    await client.query(
      `INSERT INTO variamos.language (id, name, semantics) VALUES (1, 'Feature model', '{"elementTypes": ["Feature", "Bundle"]}')`
    );
    await client.query(
      `INSERT INTO variamos.model (id, project_id, product_line_id, engineering_type, name, language_id, model)
       VALUES ($1, $2, 'pl-cars', 'domain', $3, 1, $4)`,
      [MODEL.id, MODEL.projectId, MODEL.name, JSON.stringify({ elements: MODEL.elements, relationships: MODEL.relationships })]
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
