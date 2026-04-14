import { launchCityOptions, type LaunchCityOption } from "./option-city-data";

function sortOptions(options: LaunchCityOption[]) {
  return [...options].sort((left, right) => left.label.localeCompare(right.label));
}

export function listLaunchCityOptions(): LaunchCityOption[] {
  return sortOptions(launchCityOptions);
}

export async function loadLaunchCityOptions(): Promise<LaunchCityOption[]> {
  const cityData = await import("./option-city-data");
  return sortOptions(cityData.launchCityOptions);
}