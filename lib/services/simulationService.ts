import { buildDashboardStats } from "@/lib/services/dashboardService";
import { forecastElectricityDemand } from "@/lib/services/demandForecastService";
import { forecastRenewableGeneration } from "@/lib/services/renewableForecastService";
import { scheduleVehicle } from "@/lib/services/v2gScheduler";
import { getVehicles } from "@/lib/services/vehicleService";
import { getHourlyWeather } from "@/lib/services/weatherService";
import type {
  HourlyEnergyData,
  Region,
  SimulationResult,
} from "@/lib/types";

export function buildEnergyTimeline(
  region: Region,
): HourlyEnergyData[] {
  return getHourlyWeather(region).map((weather, hour) => {
    const renewable = forecastRenewableGeneration(weather);
    const electricityDemandKw = forecastElectricityDemand(
      region,
      hour,
    );
    return {
      ...weather,
      ...renewable,
      electricityDemandKw,
      surplusPowerKw:
        renewable.renewableGenerationKw - electricityDemandKw,
      v2gChargePowerKw: 0,
      v2gDischargePowerKw: 0,
    };
  });
}

export function runSimulation(region: Region): SimulationResult {
  const baseEnergy = buildEnergyTimeline(region);
  const schedules = getVehicles().map((vehicle) =>
    scheduleVehicle(vehicle, baseEnergy),
  );

  const energy = baseEnergy.map((hour, hourIndex) => {
    const charge = schedules.reduce((sum, schedule) => {
      const item = schedule.items[hourIndex];
      return sum + (item.action === "charge" ? item.powerKw : 0);
    }, 0);
    const discharge = schedules.reduce((sum, schedule) => {
      const item = schedule.items[hourIndex];
      return sum + (item.action === "discharge" ? item.powerKw : 0);
    }, 0);

    return {
      ...hour,
      v2gChargePowerKw: Math.round(
        Math.min(Math.max(0, hour.surplusPowerKw), charge),
      ),
      v2gDischargePowerKw: Math.round(
        Math.min(Math.max(0, -hour.surplusPowerKw), discharge),
      ),
    };
  });

  return {
    region,
    energy,
    schedules,
    stats: buildDashboardStats(energy, schedules),
  };
}
