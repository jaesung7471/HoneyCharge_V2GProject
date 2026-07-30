import { DEMO_CURRENT_HOUR } from "@/lib/data/mockData";
import type {
  DashboardStats,
  HourlyEnergyData,
  VehicleSchedule,
} from "@/lib/types";

export function buildDashboardStats(
  energy: HourlyEnergyData[],
  schedules: VehicleSchedule[],
): DashboardStats {
  const renewableKWh = energy.reduce(
    (sum, item) => sum + item.renewableGenerationKw,
    0,
  );
  const demandKWh = energy.reduce(
    (sum, item) => sum + item.electricityDemandKw,
    0,
  );
  const absorbedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gChargePowerKw,
    0,
  );
  const suppliedEnergyKWh = energy.reduce(
    (sum, item) => sum + item.v2gDischargePowerKw,
    0,
  );
  const currentItems = schedules.map(
    (schedule) => schedule.items[DEMO_CURRENT_HOUR],
  );
  const peak = energy.reduce((max, item) =>
    item.electricityDemandKw > max.electricityDemandKw ? item : max,
  );

  return {
    renewableEnergyMWh: Number((renewableKWh / 1000).toFixed(1)),
    demandEnergyMWh: Number((demandKWh / 1000).toFixed(1)),
    participatingVehicles: schedules.filter(
      ({ vehicle }) =>
        vehicle.isConnected && vehicle.isV2GEnabled,
    ).length,
    chargingVehicles: currentItems.filter(
      (item) => item.action === "charge",
    ).length,
    dischargingVehicles: currentItems.filter(
      (item) => item.action === "discharge",
    ).length,
    standbyVehicles: currentItems.filter(
      (item) => item.action === "standby",
    ).length,
    absorbedEnergyKWh: Math.round(absorbedEnergyKWh),
    suppliedEnergyKWh: Math.round(suppliedEnergyKWh),
    curtailmentReductionKWh: Math.round(absorbedEnergyKWh * 0.86),
    peakHour: peak.timestamp.slice(11, 16),
  };
}
