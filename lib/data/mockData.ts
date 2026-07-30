import type { Vehicle, VehicleStatus } from "@/lib/types";

export const DEMO_DATE = "2026-07-30";
export const DEMO_CURRENT_HOUR = 11;

const rentalModels = [
  "아이오닉 5",
  "EV6",
  "니로 EV",
  "코나 일렉트릭",
  "아이오닉 6",
  "EV3",
];
const privateModels = [
  "테슬라 Model 3",
  "아이오닉 5",
  "EV6",
  "폴스타 2",
  "볼트 EV",
];

const atHour = (hour: number) =>
  `${DEMO_DATE}T${String(hour).padStart(2, "0")}:00:00+09:00`;

function makeVehicle(index: number, ownerType: "rental" | "private"): Vehicle {
  const rental = ownerType === "rental";
  const capacities = rental ? [58, 64, 72.6, 77.4, 84] : [54, 60, 75, 82];
  const currentSoc = 31 + ((index * 13) % 46);
  const minimumSoc = rental ? 35 + (index % 3) * 5 : 25 + (index % 4) * 5;
  const connected = index % 7 !== 0;
  const status: VehicleStatus = connected ? "standby" : "offline";

  return {
    id: `${rental ? "REN" : "OWN"}-${String(index + 1).padStart(3, "0")}`,
    ownerType,
    model: rental
      ? rentalModels[index % rentalModels.length]
      : privateModels[index % privateModels.length],
    batteryCapacityKWh: capacities[index % capacities.length],
    currentSoc: Math.max(currentSoc, minimumSoc + 3),
    targetSoc: Math.max(minimumSoc + 15, 76 + (index % 3) * 4),
    minimumSoc,
    arrivalTime: atHour(7 + (index % 5)),
    departureTime: atHour(Math.min(23, 15 + ((index * 3) % 8))),
    isConnected: connected,
    isV2GEnabled: index % 5 !== 0,
    maxChargePowerKw: index % 4 === 0 ? 11 : 7,
    maxDischargePowerKw: index % 3 === 0 ? 7 : 5,
    currentStatus: status,
  };
}

/** 실제 고객 데이터가 아닌 시연용 합성 차량 32대입니다. */
export const mockVehicles: Vehicle[] = [
  ...Array.from({ length: 22 }, (_, index) => makeVehicle(index, "rental")),
  ...Array.from({ length: 10 }, (_, index) => makeVehicle(index, "private")),
];
