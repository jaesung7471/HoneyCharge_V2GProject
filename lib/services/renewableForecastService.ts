import type { Region, WeatherHour } from "@/lib/types";

const REGION_CAPACITY = {
  jeju: { solarKw: 2_850, windKw: 1_720 },
  honam: { solarKw: 3_180, windKw: 1_260 },
} satisfies Record<Region, { solarKw: number; windKw: number }>;

export interface RenewableForecast {
  solarGenerationKw: number;
  windGenerationKw: number;
  renewableGenerationKw: number;
}

/** 일사·운량·온도와 풍속 출력곡선을 이용한 설명 가능한 시연용 추정식입니다. */
export function forecastRenewableGeneration(
  weather: WeatherHour,
): RenewableForecast {
  const capacity = REGION_CAPACITY[weather.region];
  const irradianceFactor = Math.min(1, weather.solarRadiation / 900);
  const cloudFactor = Math.max(0.35, 1 - weather.cloudCover / 135);
  const temperatureFactor = Math.max(
    0.82,
    1 - Math.max(0, weather.temperature - 25) * 0.006,
  );
  const rainFactor = weather.precipitation > 0 ? 0.82 : 1;
  const solarGenerationKw =
    capacity.solarKw *
    irradianceFactor *
    cloudFactor *
    temperatureFactor *
    rainFactor;

  const wind = weather.windSpeed;
  let windFactor = 0;
  if (wind >= 3 && wind < 12) {
    windFactor = Math.pow((wind - 3) / 9, 1.45);
  } else if (wind >= 12 && wind < 25) {
    windFactor = 1;
  }
  const pressureFactor = Math.min(
    1.04,
    Math.max(0.96, weather.pressure / 1013),
  );
  const windGenerationKw = capacity.windKw * windFactor * pressureFactor;

  return {
    solarGenerationKw: Math.round(solarGenerationKw),
    windGenerationKw: Math.round(windGenerationKw),
    renewableGenerationKw: Math.round(
      solarGenerationKw + windGenerationKw,
    ),
  };
}
