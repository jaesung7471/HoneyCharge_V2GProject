import { isVehicleAvailable } from "@/lib/services/stayDurationService";
import type {
  HourlyEnergyData,
  ScheduleAction,
  ScheduleItem,
  Vehicle,
  VehicleSchedule,
} from "@/lib/types";

const CHARGE_EFFICIENCY = 0.92;
const DISCHARGE_EFFICIENCY = 0.9;
const SURPLUS_THRESHOLD_KW = 180;
const DEFICIT_THRESHOLD_KW = -240;

function actionReason(
  action: ScheduleAction,
  urgent: boolean,
  vehicle: Vehicle,
): string {
  if (!vehicle.isConnected) {
    return "충전기에 연결되지 않아 제어 대상에서 제외";
  }
  if (urgent) return "출발 전 목표 충전량 확보를 최우선으로 배정";
  if (action === "charge") return "재생에너지 잉여 전력을 차량 배터리에 저장";
  if (action === "discharge") {
    return "피크 수요를 지원하되 최소 보장 잔량 유지";
  }
  if (!vehicle.isV2GEnabled) {
    return "V2G 미동의 차량으로 일반 충전만 허용";
  }
  return "전력 수급 차이가 기준값 이내이거나 배터리 보호 구간";
}

/**
 * 규칙 기반 스케줄러입니다. 차량 이동권(최소 SOC와 출발 목표 SOC)을
 * 전력망 신호보다 우선하며, 추후 ML 정책 모듈로 교체 가능한 순수 함수입니다.
 */
export function scheduleVehicle(
  vehicle: Vehicle,
  energy: HourlyEnergyData[],
): VehicleSchedule {
  let soc = vehicle.currentSoc;
  let chargeEnergyKWh = 0;
  let dischargeEnergyKWh = 0;
  const departureHour = Number(vehicle.departureTime.slice(11, 13));

  const items: ScheduleItem[] = energy.map((hourData, hour) => {
    const before = soc;
    let action: ScheduleAction = "standby";
    let powerKw = 0;
    let urgent = false;

    if (isVehicleAvailable(vehicle, hour)) {
      const energyNeededKWh = Math.max(
        0,
        ((vehicle.targetSoc - soc) / 100) * vehicle.batteryCapacityKWh,
      );
      const hoursLeft = Math.max(1, departureHour - hour);
      const requiredChargeHours =
        energyNeededKWh /
        (vehicle.maxChargePowerKw * CHARGE_EFFICIENCY);
      urgent =
        soc <= vehicle.minimumSoc + 2 ||
        (energyNeededKWh > 0 &&
          hoursLeft <= Math.ceil(requiredChargeHours) + 1);

      const futureRecoveryKWh =
        Math.max(0, hoursLeft - 1) *
        vehicle.maxChargePowerKw *
        CHARGE_EFFICIENCY;
      const dischargeHeadroomKWh =
        ((soc - vehicle.minimumSoc) / 100) * vehicle.batteryCapacityKWh;
      const canRecoverTarget =
        futureRecoveryKWh >=
        Math.max(
          0,
          ((vehicle.targetSoc - soc) / 100) *
            vehicle.batteryCapacityKWh,
        ) +
          vehicle.maxDischargePowerKw;

      if (
        urgent ||
        (hourData.surplusPowerKw > SURPLUS_THRESHOLD_KW && soc < 94)
      ) {
        action = "charge";
        powerKw = Math.min(
          vehicle.maxChargePowerKw,
          Math.max(2.5, hourData.surplusPowerKw / 18),
        );
        const storedKWh = powerKw * CHARGE_EFFICIENCY;
        soc = Math.min(
          95,
          soc + (storedKWh / vehicle.batteryCapacityKWh) * 100,
        );
        chargeEnergyKWh += powerKw;
      } else if (
        hourData.surplusPowerKw < DEFICIT_THRESHOLD_KW &&
        vehicle.isV2GEnabled &&
        soc >= vehicle.minimumSoc + 8 &&
        dischargeHeadroomKWh >= vehicle.maxDischargePowerKw &&
        canRecoverTarget
      ) {
        action = "discharge";
        powerKw = vehicle.maxDischargePowerKw;
        const removedKWh = powerKw / DISCHARGE_EFFICIENCY;
        soc = Math.max(
          vehicle.minimumSoc,
          soc -
            (removedKWh / vehicle.batteryCapacityKWh) * 100,
        );
        dischargeEnergyKWh += powerKw;
      }
    }

    return {
      vehicleId: vehicle.id,
      timestamp: hourData.timestamp,
      action,
      powerKw: Number(powerKw.toFixed(1)),
      expectedSocBefore: Number(before.toFixed(1)),
      expectedSocAfter: Number(soc.toFixed(1)),
      reason: actionReason(action, urgent, vehicle),
    };
  });

  return {
    vehicle,
    items,
    chargeEnergyKWh: Number(chargeEnergyKWh.toFixed(1)),
    dischargeEnergyKWh: Number(dischargeEnergyKWh.toFixed(1)),
    departureSoc: Number(soc.toFixed(1)),
    rewardPoints: Math.round(
      dischargeEnergyKWh * 42 + chargeEnergyKWh * 8,
    ),
  };
}
