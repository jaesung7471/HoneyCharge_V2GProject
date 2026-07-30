import { DEMO_DATE } from "@/lib/data/mockData";
import type { Region, WeatherHour } from "@/lib/types";

const timestampAt = (hour: number) =>
  `${DEMO_DATE}T${String(hour).padStart(2, "0")}:00:00+09:00`;

/**
 * Open-Meteo/기상청 응답으로 교체할 수 있는 정규화 경계입니다.
 * MVP에서는 네트워크 장애 없이 동작하도록 지역별 합성 예보를 반환합니다.
 */
export function getHourlyWeather(region: Region): WeatherHour[] {
  const isJeju = region === "jeju";

  return Array.from({ length: 24 }, (_, hour) => {
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const cloudBase = isJeju ? 28 : 36;
    const cloudCover = Math.round(
      Math.min(
        88,
        Math.max(
          8,
          cloudBase + Math.sin((hour + (isJeju ? 1 : 3)) * 0.72) * 18,
        ),
      ),
    );
    const rainHour =
      hour === (isJeju ? 17 : 15) || hour === (isJeju ? 18 : 16);
    const precipitation =
      rainHour && cloudCover > 42 ? (isJeju ? 0.8 : 1.4) : 0;
    const solarRadiation = Math.round(
      daylight * (isJeju ? 850 : 790) * (1 - cloudCover / 165),
    );
    const windSpeed = Number(
      (
        (isJeju ? 5.8 : 4.1) +
        Math.sin((hour + 2) * 0.48) * (isJeju ? 2.1 : 1.5)
      ).toFixed(1),
    );
    const temperature = Number(
      (
        (isJeju ? 27.2 : 28.6) +
        Math.sin(((hour - 8) / 15) * Math.PI) * 4.2
      ).toFixed(1),
    );

    return {
      timestamp: timestampAt(hour),
      region,
      temperature,
      precipitation,
      cloudCover,
      solarRadiation,
      windSpeed,
      windDirection: (isJeju ? 190 : 235) + ((hour * 7) % 45),
      pressure: Number((1007 + Math.cos(hour * 0.3) * 3).toFixed(1)),
      condition:
        precipitation > 0
          ? "약한 비"
          : cloudCover > 55
            ? "구름 많음"
            : "대체로 맑음",
    };
  });
}
