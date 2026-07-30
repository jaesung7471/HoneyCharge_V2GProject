import type { Vehicle } from "@/lib/types";

export function getHour(timestamp: string): number {
  return Number(timestamp.slice(11, 13));
}

export function getStayDurationHours(vehicle: Vehicle): number {
  return Math.max(
    0,
    getHour(vehicle.departureTime) - getHour(vehicle.arrivalTime),
  );
}

export function isVehicleAvailable(vehicle: Vehicle, hour: number): boolean {
  return (
    vehicle.isConnected &&
    hour >= getHour(vehicle.arrivalTime) &&
    hour < getHour(vehicle.departureTime)
  );
}
