"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BatteryCharging,
  CalendarClock,
  CarFront,
  ChevronRight,
  CircleGauge,
  CloudSun,
  Info,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  DEMO_CURRENT_HOUR,
  DEMO_DATE,
} from "@/lib/data/mockData";
import { runSimulation } from "@/lib/services/simulationService";
import { getStayDurationHours } from "@/lib/services/stayDurationService";
import { scheduleVehicle } from "@/lib/services/v2gScheduler";
import type {
  Region,
  ScheduleAction,
  Vehicle,
  VehicleSchedule,
} from "@/lib/types";

type View = "dashboard" | "fleet" | "owner";

const regionName: Record<Region, string> = {
  jeju: "제주",
  honam: "호남",
};
const actionLabel: Record<ScheduleAction, string> = {
  charge: "충전",
  discharge: "방전",
  standby: "대기",
};
const statusMeta = {
  charging: { label: "충전 중", className: "status-charge" },
  discharging: {
    label: "방전 중",
    className: "status-discharge",
  },
  standby: { label: "대기", className: "status-standby" },
  offline: { label: "미연결", className: "status-offline" },
};

const formatPower = (value: number) =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0,
  }).format(value);

function getScheduleStatus(schedule: VehicleSchedule) {
  if (!schedule.vehicle.isConnected) return statusMeta.offline;
  const action =
    schedule.items[DEMO_CURRENT_HOUR]?.action ?? "standby";
  if (action === "charge") return statusMeta.charging;
  if (action === "discharge") return statusMeta.discharging;
  return statusMeta.standby;
}

function Sidebar({
  view,
  onView,
  open,
  onClose,
}: {
  view: View;
  onView: (view: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  const nav = [
    {
      id: "dashboard" as const,
      label: "운영 대시보드",
      icon: LayoutDashboard,
    },
    {
      id: "fleet" as const,
      label: "차량·스케줄",
      icon: CarFront,
    },
    {
      id: "owner" as const,
      label: "차주 참여",
      icon: Users,
    },
  ];

  return (
    <>
      {open && (
        <button
          className="sidebar-scrim"
          onClick={onClose}
          aria-label="메뉴 닫기"
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            <Zap size={19} strokeWidth={2.7} />
          </span>
          <span>
            <strong>GridFlow</strong>
            <small>V2G ENERGY OS</small>
          </span>
        </div>
        <button
          className="mobile-close"
          onClick={onClose}
          aria-label="메뉴 닫기"
        >
          <X size={20} />
        </button>

        <p className="nav-kicker">WORKSPACE</p>
        <nav aria-label="주요 메뉴">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={
                view === id ? "nav-item active" : "nav-item"
              }
              onClick={() => {
                onView(id);
                onClose();
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {view === id && (
                <ChevronRight size={16} className="nav-arrow" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className="system-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>운영 안전 기준</strong>
              <p>
                사용자 이동권을 모든 전력망 요청보다 우선합니다.
              </p>
            </div>
          </div>
          <div className="operator">
            <span className="operator-avatar">관</span>
            <div>
              <strong>통합 운영센터</strong>
              <small>제주·호남 권역</small>
            </div>
            <span className="online-dot" aria-label="온라인" />
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({
  region,
  onRegion,
  onMenu,
}: {
  region: Region;
  onRegion: (region: Region) => void;
  onMenu: () => void;
}) {
  return (
    <header className="topbar">
      <button
        className="menu-button"
        onClick={onMenu}
        aria-label="메뉴 열기"
      >
        <Menu size={21} />
      </button>
      <div className="region-control">
        <MapPin size={17} />
        <select
          value={region}
          onChange={(event) =>
            onRegion(event.target.value as Region)
          }
          aria-label="운영 지역"
        >
          <option value="jeju">제주 전력권역</option>
          <option value="honam">호남 전력권역</option>
        </select>
      </div>
      <div className="topbar-meta">
        <span className="live-chip">
          <i /> 시뮬레이션 정상
        </span>
        <span className="timestamp">
          2026.07.30 11:00 기준
        </span>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  unit,
  detail,
  icon: Icon,
  tone = "mint",
}: {
  label: string;
  value: string | number;
  unit: string;
  detail: string;
  icon: typeof Leaf;
  tone?: "mint" | "blue" | "amber" | "violet";
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="stat-copy">
        <p>{label}</p>
        <strong>
          {value}
          <small>{unit}</small>
        </strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function EnergyChart({
  data,
}: {
  data: ReturnType<typeof runSimulation>["energy"];
}) {
  const chartData = data.map((item) => ({
    hour: item.timestamp.slice(11, 16),
    재생에너지: item.renewableGenerationKw,
    수요: item.electricityDemandKw,
    "V2G 충전": item.v2gChargePowerKw,
    "V2G 방전": item.v2gDischargePowerKw,
  }));

  return (
    <div
      className="chart-wrap"
      aria-label="시간대별 에너지 수급 차트"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 12, left: -16, bottom: 2 }}
        >
          <defs>
            <linearGradient
              id="renewableFill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#37a77a"
                stopOpacity={0.26}
              />
              <stop
                offset="100%"
                stopColor="#37a77a"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#e8ece9"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#77817c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "#77817c", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e4e9e6",
              borderRadius: 12,
              boxShadow: "0 12px 30px rgba(16, 42, 36, .12)",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${formatPower(Number(value))} kW`,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          />
          <ReferenceLine y={0} stroke="#b7c1bc" />
          <Area
            type="monotone"
            dataKey="재생에너지"
            fill="url(#renewableFill)"
            stroke="#27966b"
            strokeWidth={2.4}
          />
          <Line
            type="monotone"
            dataKey="수요"
            stroke="#24435d"
            strokeWidth={2.4}
            dot={false}
          />
          <Bar
            dataKey="V2G 충전"
            fill="#78c9a8"
            radius={[3, 3, 0, 0]}
            barSize={7}
          />
          <Bar
            dataKey="V2G 방전"
            fill="#f2a65a"
            radius={[3, 3, 0, 0]}
            barSize={7}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function DashboardView({
  simulation,
  onFleet,
}: {
  simulation: ReturnType<typeof runSimulation>;
  onFleet: () => void;
}) {
  const { stats, energy, schedules, region } = simulation;
  const current = energy[DEMO_CURRENT_HOUR];
  const visibleSchedules = schedules
    .filter((item) => item.vehicle.ownerType === "rental")
    .slice(0, 7);

  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <span /> GRID OPERATIONS
          </span>
          <h1>{regionName[region]} V2G 통합 운영</h1>
          <p>
            재생에너지 수급과 차량 가용성을 함께 고려한 오늘의
            운영 계획입니다.
          </p>
        </div>
        <div className="weather-summary">
          <CloudSun size={22} />
          <div>
            <strong>{current.temperature}°</strong>
            <span>
              {current.condition} · 풍속 {current.windSpeed}m/s
            </span>
          </div>
        </div>
      </section>

      <section
        className="stat-grid"
        aria-label="핵심 운영 지표"
      >
        <StatCard
          label="예상 재생에너지"
          value={stats.renewableEnergyMWh}
          unit="MWh"
          detail="오늘 24시간 합계"
          icon={Leaf}
        />
        <StatCard
          label="예상 전력 수요"
          value={stats.demandEnergyMWh}
          unit="MWh"
          detail={`피크 ${stats.peakHour}`}
          icon={Zap}
          tone="blue"
        />
        <StatCard
          label="V2G 참여 차량"
          value={stats.participatingVehicles}
          unit="대"
          detail={`전체 ${schedules.length}대 중 연결·동의`}
          icon={CarFront}
          tone="violet"
        />
        <StatCard
          label="잉여전력 흡수"
          value={stats.absorbedEnergyKWh}
          unit="kWh"
          detail={`출력제어 ${stats.curtailmentReductionKWh}kWh 감소 예상`}
          icon={ArrowDownToLine}
        />
        <StatCard
          label="피크 공급"
          value={stats.suppliedEnergyKWh}
          unit="kWh"
          detail="차량 최소 SOC 보장"
          icon={ArrowUpFromLine}
          tone="amber"
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                24H ENERGY FLOW
              </span>
              <h2>시간대별 전력 수급</h2>
            </div>
            <div className="chart-note">
              <i /> 재생에너지 우선 충전
            </div>
          </div>
          <EnergyChart data={energy} />
        </article>

        <aside className="panel dispatch-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">NOW · 11:00</span>
              <h2>실시간 배차 현황</h2>
            </div>
          </div>
          <div className="dispatch-ring">
            <div className="ring-visual">
              <span>
                <strong>{stats.participatingVehicles}</strong>
                <small>참여 차량</small>
              </span>
            </div>
          </div>
          <div className="dispatch-list">
            <div>
              <span>
                <i className="charge-dot" />
                충전 중
              </span>
              <strong>
                {stats.chargingVehicles}
                <small>대</small>
              </strong>
            </div>
            <div>
              <span>
                <i className="discharge-dot" />
                방전 중
              </span>
              <strong>
                {stats.dischargingVehicles}
                <small>대</small>
              </strong>
            </div>
            <div>
              <span>
                <i className="standby-dot" />
                대기
              </span>
              <strong>
                {stats.standbyVehicles}
                <small>대</small>
              </strong>
            </div>
          </div>
          <div className="grid-signal">
            <Sparkles size={17} />
            <div>
              <strong>현재 전력망 신호</strong>
              <span>
                {current.surplusPowerKw > 0
                  ? "잉여전력 흡수 권장"
                  : "피크 지원 준비"}
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel fleet-preview">
        <div className="panel-head">
          <div>
            <span className="section-label">FLEET SCHEDULE</span>
            <h2>렌터카 운영 스케줄</h2>
          </div>
          <button className="text-button" onClick={onFleet}>
            전체 차량 보기 <ChevronRight size={15} />
          </button>
        </div>
        <VehicleTable
          schedules={visibleSchedules}
          onSelect={() => onFleet()}
          compact
        />
      </section>
    </>
  );
}

function VehicleTable({
  schedules,
  selectedId,
  onSelect,
  compact = false,
}: {
  schedules: VehicleSchedule[];
  selectedId?: string;
  onSelect: (schedule: VehicleSchedule) => void;
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table className="vehicle-table">
        <thead>
          <tr>
            <th>차량</th>
            <th>현재 SOC</th>
            <th>출발 / 예약</th>
            <th>V2G</th>
            <th>현재 상태</th>
            {!compact && <th>예상 보상</th>}
            <th>
              <span className="sr-only">상세</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => {
            const { vehicle } = schedule;
            const status = getScheduleStatus(schedule);
            return (
              <tr
                key={vehicle.id}
                className={
                  selectedId === vehicle.id ? "selected-row" : ""
                }
                onClick={() => onSelect(schedule)}
              >
                <td>
                  <span className="vehicle-cell">
                    <i>
                      <CarFront size={16} />
                    </i>
                    <span>
                      <strong>{vehicle.id}</strong>
                      <small>{vehicle.model}</small>
                    </span>
                  </span>
                </td>
                <td>
                  <strong>{vehicle.currentSoc}%</strong>
                  <span className="soc-bar">
                    <i
                      style={{ width: `${vehicle.currentSoc}%` }}
                    />
                  </span>
                </td>
                <td>{vehicle.departureTime.slice(11, 16)}</td>
                <td>
                  <span
                    className={
                      vehicle.isV2GEnabled
                        ? "consent yes"
                        : "consent"
                    }
                  >
                    {vehicle.isV2GEnabled ? "동의" : "미동의"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-pill ${status.className}`}
                  >
                    <i />
                    {status.label}
                  </span>
                </td>
                {!compact && (
                  <td>
                    <strong className="reward">
                      {schedule.rewardPoints.toLocaleString()} P
                    </strong>
                  </td>
                )}
                <td>
                  <button
                    className="row-button"
                    aria-label={`${vehicle.id} 상세 보기`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleStrip({
  schedule,
}: {
  schedule: VehicleSchedule;
}) {
  const activeItems = schedule.items.filter(
    (_, index) => index >= 7 && index <= 22,
  );
  return (
    <div className="schedule-strip">
      {activeItems.map((item) => (
        <div
          key={item.timestamp}
          className={`schedule-hour ${item.action}`}
          title={item.reason}
        >
          <span>{item.timestamp.slice(11, 13)}</span>
          <i />
        </div>
      ))}
    </div>
  );
}

function VehicleDetail({
  schedule,
}: {
  schedule: VehicleSchedule;
}) {
  const { vehicle } = schedule;
  const nextAction = schedule.items.find(
    (item) =>
      item.action !== "standby" &&
      Number(item.timestamp.slice(11, 13)) >=
        DEMO_CURRENT_HOUR,
  );

  return (
    <aside className="vehicle-detail">
      <div className="detail-title">
        <div className="detail-car">
          <CarFront size={24} />
        </div>
        <div>
          <span>{vehicle.id}</span>
          <h2>{vehicle.model}</h2>
          <p>
            {vehicle.ownerType === "rental"
              ? "렌터카 운영 차량"
              : "일반 차주 차량"}
          </p>
        </div>
      </div>

      <div className="battery-card">
        <div className="battery-head">
          <span>현재 배터리</span>
          <strong>{vehicle.currentSoc}%</strong>
        </div>
        <div className="battery-track">
          <i style={{ width: `${vehicle.currentSoc}%` }} />
        </div>
        <div className="battery-labels">
          <span>최소 {vehicle.minimumSoc}%</span>
          <span>목표 {vehicle.targetSoc}%</span>
        </div>
      </div>

      <div className="detail-metrics">
        <div>
          <span>
            <CalendarClock size={15} /> 출발 예정
          </span>
          <strong>{vehicle.departureTime.slice(11, 16)}</strong>
        </div>
        <div>
          <span>
            <CircleGauge size={15} /> 예상 체류
          </span>
          <strong>{getStayDurationHours(vehicle)}시간</strong>
        </div>
        <div>
          <span>
            <BatteryCharging size={15} /> 충전 예상
          </span>
          <strong>{schedule.chargeEnergyKWh}kWh</strong>
        </div>
        <div>
          <span>
            <ArrowUpFromLine size={15} /> 방전 예상
          </span>
          <strong>{schedule.dischargeEnergyKWh}kWh</strong>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-head">
          <strong>시간대별 추천</strong>
          <span>07—22시</span>
        </div>
        <ScheduleStrip schedule={schedule} />
        <div className="schedule-legend">
          <span>
            <i className="charge-dot" />
            충전
          </span>
          <span>
            <i className="discharge-dot" />
            방전
          </span>
          <span>
            <i className="standby-dot" />
            대기
          </span>
        </div>
      </div>

      <div className="recommendation">
        <span>
          <Sparkles size={17} />
        </span>
        <div>
          <strong>다음 권장 제어</strong>
          <p>
            {nextAction
              ? `${nextAction.timestamp.slice(11, 16)} ${
                  actionLabel[nextAction.action]
                } · ${nextAction.reason}`
              : "출발 전 추가 제어가 필요하지 않습니다."}
          </p>
        </div>
      </div>

      <div className="departure-guarantee">
        <ShieldCheck size={17} />
        <span>
          출발 예상 SOC{" "}
          <strong>{schedule.departureSoc}%</strong> · 최소 보장
          충족
        </span>
      </div>
    </aside>
  );
}

function FleetView({
  simulation,
}: {
  simulation: ReturnType<typeof runSimulation>;
}) {
  const [filter, setFilter] = useState<
    "all" | "rental" | "private"
  >("all");
  const filtered = simulation.schedules.filter(
    ({ vehicle }) =>
      filter === "all" || vehicle.ownerType === filter,
  );
  const [selectedId, setSelectedId] = useState(
    simulation.schedules[0].vehicle.id,
  );
  const selected =
    simulation.schedules.find(
      ({ vehicle }) => vehicle.id === selectedId,
    ) ?? simulation.schedules[0];

  return (
    <>
      <section className="page-heading compact-heading">
        <div>
          <span className="eyebrow">
            <span /> VEHICLE ORCHESTRATION
          </span>
          <h1>차량·스케줄 관리</h1>
          <p>
            차량별 가용시간과 배터리 보호 조건을 확인하고 추천
            근거를 검토합니다.
          </p>
        </div>
        <div className="filter-tabs">
          {(["all", "rental", "private"] as const).map(
            (item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item === "all"
                  ? "전체"
                  : item === "rental"
                    ? "렌터카"
                    : "일반 차주"}
              </button>
            ),
          )}
        </div>
      </section>
      <div className="fleet-layout">
        <section className="panel fleet-list-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">
                CONNECTED FLEET
              </span>
              <h2>등록 차량 {filtered.length}대</h2>
            </div>
            <span className="small-note">
              <i /> 시연용 합성 데이터
            </span>
          </div>
          <VehicleTable
            schedules={filtered}
            selectedId={selected.vehicle.id}
            onSelect={(schedule) =>
              setSelectedId(schedule.vehicle.id)
            }
          />
        </section>
        <VehicleDetail schedule={selected} />
      </div>
    </>
  );
}

function OwnerView({
  simulation,
}: {
  simulation: ReturnType<typeof runSimulation>;
}) {
  const [currentSoc, setCurrentSoc] = useState(46);
  const [targetSoc, setTargetSoc] = useState(82);
  const [minimumSoc, setMinimumSoc] = useState(35);
  const [departureHour, setDepartureHour] = useState(19);
  const [v2gEnabled, setV2gEnabled] = useState(true);

  const ownerSchedule = useMemo(() => {
    const vehicle: Vehicle = {
      id: "MY-EV",
      ownerType: "private",
      model: "내 전기차",
      batteryCapacityKWh: 72.6,
      currentSoc,
      targetSoc: Math.max(targetSoc, minimumSoc),
      minimumSoc: Math.min(minimumSoc, currentSoc),
      arrivalTime: `${DEMO_DATE}T${String(
        DEMO_CURRENT_HOUR,
      ).padStart(2, "0")}:00:00+09:00`,
      departureTime: `${DEMO_DATE}T${String(
        departureHour,
      ).padStart(2, "0")}:00:00+09:00`,
      isConnected: true,
      isV2GEnabled: v2gEnabled,
      maxChargePowerKw: 7,
      maxDischargePowerKw: 5,
      currentStatus: "standby",
    };
    return scheduleVehicle(vehicle, simulation.energy);
  }, [
    currentSoc,
    targetSoc,
    minimumSoc,
    departureHour,
    v2gEnabled,
    simulation.energy,
  ]);

  const chargeHours = ownerSchedule.items.filter(
    (item) => item.action === "charge",
  );
  const dischargeHours = ownerSchedule.items.filter(
    (item) => item.action === "discharge",
  );

  return (
    <>
      <section className="page-heading compact-heading">
        <div>
          <span className="eyebrow">
            <span /> DRIVER PARTICIPATION
          </span>
          <h1>내 차로 에너지 전환에 참여하세요</h1>
          <p>
            출발에 필요한 배터리는 보장하고, 주차 중 남는 시간만
            활용합니다.
          </p>
        </div>
        <div className="owner-assurance">
          <ShieldCheck size={19} />
          <span>
            <strong>이동권 우선</strong> 최소 배터리 이하 방전
            없음
          </span>
        </div>
      </section>

      <div className="owner-layout">
        <section className="panel owner-form-panel">
          <div className="panel-head">
            <div>
              <span className="section-label">MY EV SETTINGS</span>
              <h2>운행 계획 입력</h2>
            </div>
            <PlugZap size={21} className="panel-icon" />
          </div>

          <SliderField
            id="currentSoc"
            label="현재 배터리 잔량"
            value={currentSoc}
            min={20}
            max={90}
            onChange={setCurrentSoc}
          />
          <SliderField
            id="targetSoc"
            label="희망 출발 잔량"
            value={targetSoc}
            min={50}
            max={95}
            onChange={setTargetSoc}
          />
          <SliderField
            id="minimumSoc"
            label="최소 보장 잔량"
            value={minimumSoc}
            min={20}
            max={60}
            onChange={setMinimumSoc}
          />

          <label className="time-field">
            <span>
              <CalendarClock size={16} /> 출발 예정 시간
            </span>
            <select
              value={departureHour}
              onChange={(event) =>
                setDepartureHour(Number(event.target.value))
              }
            >
              {[15, 16, 17, 18, 19, 20, 21, 22, 23].map(
                (hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="consent-toggle">
            <span>
              <strong>V2G 방전 참여</strong>
              <small>
                최소 잔량과 출발 목표를 지키는 범위에서만 참여
              </small>
            </span>
            <input
              type="checkbox"
              checked={v2gEnabled}
              onChange={(event) =>
                setV2gEnabled(event.target.checked)
              }
            />
            <i aria-hidden="true" />
          </label>
        </section>

        <section className="owner-result">
          <article className="reward-hero">
            <span className="reward-kicker">
              오늘의 예상 리워드
            </span>
            <strong>
              {ownerSchedule.rewardPoints.toLocaleString()}
              <small> P</small>
            </strong>
            <p>
              시연 기준: 방전 1kWh당 42P, 잉여전력 충전
              1kWh당 8P
            </p>
            <div className="reward-energy">
              <span>
                <ArrowDownToLine size={16} />
                충전 {ownerSchedule.chargeEnergyKWh}kWh
              </span>
              <span>
                <ArrowUpFromLine size={16} />
                방전 {ownerSchedule.dischargeEnergyKWh}kWh
              </span>
            </div>
          </article>

          <article className="panel owner-schedule-card">
            <div className="panel-head">
              <div>
                <span className="section-label">
                  SMART SCHEDULE
                </span>
                <h2>오늘의 추천 일정</h2>
              </div>
              <span className="generated-chip">
                <Sparkles size={13} /> 자동 계산
              </span>
            </div>
            <ScheduleStrip schedule={ownerSchedule} />
            <div className="owner-actions">
              <div className="action-box charge">
                <span>
                  <ArrowDownToLine size={17} />
                </span>
                <div>
                  <small>추천 충전</small>
                  <strong>
                    {chargeHours.length
                      ? chargeHours
                          .map((item) =>
                            item.timestamp.slice(11, 16),
                          )
                          .join(", ")
                      : "없음"}
                  </strong>
                </div>
              </div>
              <div className="action-box discharge">
                <span>
                  <ArrowUpFromLine size={17} />
                </span>
                <div>
                  <small>추천 방전</small>
                  <strong>
                    {dischargeHours.length
                      ? dischargeHours
                          .map((item) =>
                            item.timestamp.slice(11, 16),
                          )
                          .join(", ")
                      : "없음"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="soc-outcome">
              <div className="soc-circle">
                <strong>{ownerSchedule.departureSoc}%</strong>
                <span>출발 예상</span>
              </div>
              <div>
                <strong>목표 배터리를 안전하게 확보합니다</strong>
                <p>
                  최소 보장 {minimumSoc}% 아래로 방전하지 않으며,
                  출발이 가까워지면 전력망 신호보다 충전을
                  우선합니다.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="slider-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <strong>{value}%</strong>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-labels">
        <span>{min}%</span>
        <span>{max}%</span>
      </span>
    </div>
  );
}

export function GridFlowApp() {
  const [region, setRegion] = useState<Region>("jeju");
  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const simulation = useMemo(
    () => runSimulation(region),
    [region],
  );

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onView={setView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="app-main">
        <Header
          region={region}
          onRegion={setRegion}
          onMenu={() => setSidebarOpen(true)}
        />
        <main className="content">
          {view === "dashboard" && (
            <DashboardView
              simulation={simulation}
              onFleet={() => setView("fleet")}
            />
          )}
          {view === "fleet" && (
            <FleetView simulation={simulation} />
          )}
          {view === "owner" && (
            <OwnerView simulation={simulation} />
          )}
          <footer className="data-notice">
            <Info size={15} />
            <span>
              본 화면의 날씨·발전량·수요·차량 데이터는 서비스
              검증을 위한 시연용 추정값이며 실제 계통 운영 또는
              정산에 사용할 수 없습니다.
            </span>
            <span>모델 v0.1 · 규칙 기반</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
