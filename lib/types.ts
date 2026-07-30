export type Region = "jeju" | "honam";
export type OwnerType = "rental" | "private";
export type ScheduleAction = "charge" | "discharge" | "standby";
export type VehicleStatus = "charging" | "discharging" | "standby" | "offline";

export interface WeatherHour {
  timestamp: string;
  region: Region;
  temperature: number;
  precipitation: number;
  cloudCover: number;
  solarRadiation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  condition: string;
}

export interface HourlyEnergyData extends WeatherHour {
  solarGenerationKw: number;
  windGenerationKw: number;
  renewableGenerationKw: number;
  electricityDemandKw: number;
  surplusPowerKw: number;
  v2gChargePowerKw: number;
  v2gDischargePowerKw: number;
}

export interface Vehicle {
  id: string;
  ownerType: OwnerType;
  model: string;
  batteryCapacityKWh: number;
  currentSoc: number;
  targetSoc: number;
  minimumSoc: number;
  arrivalTime: string;
  departureTime: string;
  isConnected: boolean;
  isV2GEnabled: boolean;
  maxChargePowerKw: number;
  maxDischargePowerKw: number;
  currentStatus: VehicleStatus;
}

export interface ScheduleItem {
  vehicleId: string;
  timestamp: string;
  action: ScheduleAction;
  powerKw: number;
  expectedSocBefore: number;
  expectedSocAfter: number;
  reason: string;
}

export interface VehicleSchedule {
  vehicle: Vehicle;
  items: ScheduleItem[];
  chargeEnergyKWh: number;
  dischargeEnergyKWh: number;
  departureSoc: number;
  rewardPoints: number;
}

export interface DashboardStats {
  renewableEnergyMWh: number;
  demandEnergyMWh: number;
  participatingVehicles: number;
  chargingVehicles: number;
  dischargingVehicles: number;
  standbyVehicles: number;
  absorbedEnergyKWh: number;
  suppliedEnergyKWh: number;
  curtailmentReductionKWh: number;
  peakHour: string;
}

export interface SimulationResult {
  region: Region;
  energy: HourlyEnergyData[];
  schedules: VehicleSchedule[];
  stats: DashboardStats;
}
