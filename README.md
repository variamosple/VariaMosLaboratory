# VariaMosLaboratory
This project contains the Laboratory module of the VariaMos platform.

The interface of the Laboratory: experiments (creation, versions, lifecycle, sharing, comments), runs with their
dashboard, results (comparison, charts, export, solver benchmark) and reproducibility (packages, persistent
links, runs side by side). It talks to the Laboratory backend (`variamos_ms_laboratory`), to the Administration
module for the session, and to vms_projects for projects and models.

## Deployment

Each merge on `main` builds `jasotov/variamoslaboratory:main` and recreates the service on the production server
(`.github/workflows/variamoslaboratory-main-aws-image.yml`). The workflow writes the addresses of the services to
`.env` before the build: those of the platform from the organization variables the other interfaces use
(`REACT_APP_ADMIN_API_URL`, `REACT_APP_LOGIN_URL`, `REACT_APP_PROJECTS_API_URL`, `REACT_APP_LANGUAGES_API_URL`),
and two variables of this repository: `REACT_APP_URLBACKENDLABORATORY` (the Laboratory backend,
`https://app.variamos.com/variamos_ms_laboratory`) and `REACT_APP_URLBACKENDRESTRICTION` (the restriction service,
the same address as in VariaMosPLE). The run stops before the build when one of them has no value.
The checklist, with the backend, is `DEPLOYMENT.md` in `variamos_ms_laboratory`.

## Tests

```bash
CI=true npx react-scripts test --watchAll=false   # entities, services and contract (no browser)
```

## End-to-end tests

`e2e/` runs the real Laboratory backend on a test PostgreSQL database and the production build of this
interface in Chromium (Playwright). The Administration module and vms_projects are answered by the tests:
the session of two researchers, the projects and one model. The backend clone is expected next to this one
(`../variamos_ms_laboratory`, or `LAB_BACKEND_DIR`); Chromium is `/usr/bin/chromium` (or `E2E_CHROMIUM`).

```bash
cd e2e
npm install
./run.sh                          # database, backend build and migrations, interface build, all tests
./run.sh tests/runs.spec.ts       # extra arguments go to "playwright test"
```

The functional walkthrough plays one long journey through the whole interface: two researchers, from an empty
project to runs, results, exports, a reproduced run, comments, concurrent edits, archive and delete. Each step
names its requirement, and a failed step does not stop the journey. Run it after `./run.sh`, on the same build:

```bash
npx playwright test -c playwright.walkthrough.config.ts
```

The report is `e2e/.work/walkthrough/report.json`, with a screenshot of each step and the exported files next
to it.

The experiment list is sorted by name and paginated: a test that opens its experiment from the list searches
for it first (`showInList` in `e2e/support/fixtures.ts`).
