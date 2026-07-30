import type { Region } from "@/lib/types";

/** 주거·관광·상업 부하의 아침/저녁 피크를 합성한 시연용 수요 곡선입니다. */
export function forecastElectricityDemand(
  region: Region,
  hour: number,
): number {
  const base = region === "jeju" ? 1_780 : 2_020;
  const morningPeak = 650 * Math.exp(-Math.pow((hour - 8) / 2.3, 2));
  const afternoonCooling =
    560 * Math.exp(-Math.pow((hour - 15) / 4.2, 2));
  const eveningPeak = 1_120 * Math.exp(-Math.pow((hour - 20) / 2.8, 2));
  const overnight = hour < 6 ? -230 : 0;
  return Math.round(
    base + morningPeak + afternoonCooling + eveningPeak + overnight,
  );
}
