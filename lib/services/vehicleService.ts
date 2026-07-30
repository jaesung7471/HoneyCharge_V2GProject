import { mockVehicles } from "@/lib/data/mockData";
import type { OwnerType, Vehicle } from "@/lib/types";

export function getVehicles(ownerType?: OwnerType): Vehicle[] {
  return ownerType
    ? mockVehicles.filter((vehicle) => vehicle.ownerType === ownerType)
    : mockVehicles;
}

export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find((vehicle) => vehicle.id === id);
}
