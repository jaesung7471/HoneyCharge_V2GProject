# GridFlow — Jeju/Honam V2G Operations MVP

**🇺🇸 [English](#english)** | **🇰🇷 [한국어](#한국어)**

GridFlow is a web-based Vehicle-to-Grid (V2G) simulator connecting surplus renewable power in Jeju/Honam, South Korea, with parked EV batteries. It is a hackathon demo built on explainable, rule-based logic and synthetic data — it does not connect to any real charger, power grid, or settlement system.

---

<a id="english"></a>
## English

### Overview

GridFlow simulates how a regional grid operator could balance renewable oversupply/undersupply against a fleet of parked EVs (rental + private) by recommending charge/discharge actions per vehicle, while respecting each driver's departure time and minimum guaranteed state of charge (SOC).

### Features

- Region switcher (Jeju / Honam) with a 24-hour weather, generation, and demand simulation
- Solar output estimated from irradiance/cloud cover/temperature; wind output estimated from a wind-speed power curve
- Combined chart of grid surplus/deficit and aggregate V2G charge/discharge volume
- Per-vehicle schedule across 22 rental EVs and 10 private EVs
- Per-vehicle detail: SOC, dwell time, expected charge/discharge amount, and recommendation rationale
- A driver-input screen that recalculates participation and rewards instantly
- Safety rule: departure SOC targets and minimum guaranteed SOC always take priority over grid requests

### Tech Stack

- React 19, Next.js-compatible `vinext` runtime, TypeScript 5
- Tailwind CSS 4, Recharts, Lucide React
- Cloudflare Workers / Vite for deployment tooling
- Drizzle ORM (SQLite/D1) — schema present for future persistence; not required to run the MVP

Exact versions are pinned in `package.json` and `package-lock.json`.

### Prerequisites

- OS: Windows 10/11, macOS, or Linux
- Node.js 22.13.0+ (npm bundled with Node)
- ~4GB RAM recommended for local dev
- A modern browser (Chrome, Edge, Safari, or Firefox)
- No Python runtime or external database is required

### Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Verification

```bash
npm run build
npm run lint
npm test
```

### Project Structure

```text
app/
  page.tsx                 App entry point
  layout.tsx                Metadata and Korean-locale document settings
components/
  GridFlowApp.tsx           Dashboard, vehicle detail, and driver-participation UI
lib/
  types.ts                  Shared data models
  data/mockData.ts          Synthetic data for 32 vehicles
  services/
    weatherService.ts       Hourly weather normalization
    renewableForecastService.ts
    demandForecastService.ts
    stayDurationService.ts
    vehicleService.ts
    v2gScheduler.ts
    simulationService.ts
    dashboardService.ts
db/                         Drizzle schema (D1), not required for the MVP demo
worker/                     Cloudflare Worker entry point
tests/
  rendered-html.test.mjs    Verifies the production build renders
```

### Core Assumptions and Decision Logic

- All data is synthetic, for demonstration only — nothing reflects live measurements.
- Generation/demand are expressed in kW at 1-hour resolution, so hourly totals read as kWh.
- Charging is prioritized when renewable generation exceeds demand by 180kW or more.
- When demand exceeds generation by 240kW or more, the scheduler considers discharge from vehicles that have opted in to V2G, are plugged in, and support bidirectional charging.
- Charging efficiency is modeled at 92%, discharging at 90%.
- If there isn't enough time left to reach the departure SOC target, charging is prioritized regardless of grid signals.
- Vehicles are never discharged below their minimum guaranteed SOC, and never discharged if there's no way to recover the departure SOC target in time.
- Demo reward rates: 42 points per kWh discharged, 8 points per kWh charged from surplus power.

### Environment Variables

The MVP currently runs with no API keys — weather, generation, demand, and vehicle data are all synthetic. `weatherService` returns synthetic per-region forecasts for stable local startup.

If you later connect a real weather API:
- **Open-Meteo** requires no API key for its base forecast endpoint.
- For the Korea Meteorological Administration (KMA) API, never hardcode the key — store it in a project-root `.env.local` file (already gitignored, so it won't be committed).

```text
KMA_SERVICE_KEY=your_issued_key
```

Normalize the API response into the `WeatherHour` shape and the rest of the forecasting/scheduling modules require no changes.

### Out of Scope

Real power-market trading, real charger control, payment/settlement, authentication, long-term data storage, and calibration against measured generation data are not part of this MVP.

---

<a id="한국어"></a>
## 한국어

GridFlow는 제주·호남의 재생에너지 잉여 전력과 주차 중인 전기차 배터리를 연결하는 웹 기반 V2G 시뮬레이터입니다. 실제 충전기·전력망·정산 시스템에는 연결하지 않으며, 해커톤 시연을 위해 설명 가능한 규칙 기반 로직과 합성 데이터를 사용합니다.

### 주요 기능

- 제주/호남 권역 전환과 24시간 날씨·발전량·수요 시뮬레이션
- 일사량·운량·기온 기반 태양광 추정과 풍속 출력곡선 기반 풍력 추정
- 전력 과잉/부족 및 V2G 충전·방전량 통합 차트
- 렌터카 22대, 일반 차주 차량 10대의 차량별 스케줄
- 차량별 SOC, 체류시간, 충·방전 예상량, 추천 사유 상세
- 차주 입력값에 따라 즉시 다시 계산되는 참여·보상 화면
- 출발 목표와 최소 보장 SOC를 전력망 요청보다 우선하는 안전 규칙

### 기술 스택

- React 19, Next.js 호환 `vinext` 런타임, TypeScript 5
- Tailwind CSS 4, Recharts, Lucide React
- Cloudflare Workers / Vite 배포 도구
- Drizzle ORM (SQLite/D1) — 향후 영속화를 위한 스키마이며 MVP 실행에는 필요하지 않음

정확한 버전과 전체 의존성은 `package.json`과 `package-lock.json`에 고정되어 있습니다.

### 필수 환경

- 운영체제: Windows 10/11, macOS 또는 Linux
- Node.js: 22.13.0 이상 (npm은 Node.js에 포함)
- 메모리: 개발 실행 기준 4GB 이상 권장
- 브라우저: 최신 Chrome, Edge, Safari 또는 Firefox
- Python이나 별도의 데이터베이스는 필요하지 않습니다.

### 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

### 검증

```bash
npm run build
npm run lint
npm test
```

### 구조

```text
app/
  page.tsx                 앱 진입점
  layout.tsx                메타데이터와 한국어 문서 설정
components/
  GridFlowApp.tsx           대시보드·차량 상세·차주 참여 UI
lib/
  types.ts                  공통 데이터 모델
  data/mockData.ts          차량 32대 합성 데이터
  services/
    weatherService.ts       시간대별 날씨 정규화 로직
    renewableForecastService.ts
    demandForecastService.ts
    stayDurationService.ts
    vehicleService.ts
    v2gScheduler.ts
    simulationService.ts
    dashboardService.ts
db/                          Drizzle 스키마 (D1) — MVP 시연에는 필요하지 않음
worker/                      Cloudflare Worker 진입점
tests/
  rendered-html.test.mjs    배포 빌드 렌더링 검증
```

### MVP 가정과 판단 기준

- 모든 데이터는 실제 측정값이 아닌 시연용 합성값입니다.
- 발전·수요 단위는 kW, 시간 간격은 1시간이므로 시간대 합산값은 kWh로 해석합니다.
- 재생에너지 발전이 수요보다 180kW 이상 많으면 충전을 우선합니다.
- 수요가 발전보다 240kW 이상 많으면, V2G 동의·연결·양방향 충전 가능 차량에 방전을 검토합니다.
- 충전 효율은 92%, 방전 효율은 90%로 가정합니다.
- 출발 목표 SOC 확보에 필요한 시간이 부족해지면 계통 신호와 무관하게 충전을 우선합니다.
- 최소 보장 SOC 이하로 방전하지 않으며, 출발 전 목표 SOC 회복 가능성이 없으면 방전하지 않습니다.
- 보상은 시연값으로 방전 1kWh당 42P, 잉여전력 충전 1kWh당 8P입니다.

### 외부 날씨 API 연결

현재는 초기 실행 안정성을 위해 `weatherService`가 지역별 합성 예보를 반환합니다. 별도 API 키 없이 실행됩니다.

- Open-Meteo는 기본 예보 API에 별도 키가 필요하지 않습니다.
- 기상청(KMA) API를 사용할 경우 키를 코드에 직접 작성하지 말고, 프로젝트 루트의 `.env.local`(이미 `.gitignore`에 포함되어 커밋되지 않음)에 저장해야 합니다.

```text
KMA_SERVICE_KEY=발급받은_키
```

API 응답을 `WeatherHour` 형식으로 정규화하면 나머지 예측·스케줄링 모듈은 변경하지 않아도 됩니다.

### 범위 밖

실제 전력시장 거래, 충전기 제어, 결제·정산, 인증, 장기 데이터 저장, 실측 발전량 보정은 이 MVP에 포함하지 않습니다.
