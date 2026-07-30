GridFlow V2G MVP - Execution Requirements
==========================================

Note: This is a Node.js/TypeScript project. There are no Python
dependencies, so this file is a plain-text requirements list, not a
pip requirements file.

1. Required environment
------------------------
OS        : Windows 10/11, macOS, or Linux
Node.js   : 22.13.0 or later (npm ships with Node.js)
Memory    : 4GB+ recommended for local dev
Browser   : latest Chrome, Edge, Safari, or Firefox

No Python runtime and no external database are required.

2. Install and run
-------------------
npm install
npm run dev

Then open http://localhost:3000 in your browser.

3. Verification commands
-------------------------
npm run build
npm run lint
npm test

4. Key packages
----------------
- React 19
- Next.js-compatible vinext runtime
- TypeScript 5
- Tailwind CSS 4
- Recharts
- Lucide React
- Cloudflare Workers / Vite deployment tooling

Exact versions and the full dependency tree are pinned in
package.json and package-lock.json.

5. Environment variables
--------------------------
The MVP currently runs with no API keys. Weather, generation, demand,
and vehicle data are all synthetic demo data.

If connecting the Korea Meteorological Administration (KMA) API
later, do not hardcode the key in source. Store it as an environment
variable in .env.local at the project root instead:

    KMA_SERVICE_KEY=your_issued_key

.env.local is gitignored and is not included in Git or shared
archives.

Open-Meteo's base forecast API requires no key.

6. Demo data and limitations
-------------------------------
- The 22 rental EVs and 10 private EVs are synthetic data, not real
  customer information.
- Generation, power demand, and V2G rewards are demo estimates.
- Real charger control, power-market trading, payment/settlement,
  and authentication are not included.
- Production use would require calibration against measured data,
  a security review, battery manufacturer policy review, and power
  market regulation review.

7. Core folders
-----------------
app/            entry points and global styles
components/     admin, vehicle, and driver screens
lib/data/       synthetic vehicle data
lib/services/   weather, generation, demand, and scheduling logic
tests/          server-rendering tests

For detailed features and algorithm assumptions, see README.md.
