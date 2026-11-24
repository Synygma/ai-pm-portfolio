// Countries and cities (only real ones can be entered) and the time zone of a city.
//
// Cities: GeoNames places with 1,000+ people (via the MIT-licensed `all-the-cities` package; data
// CC BY 4.0, geonames.org). Time zone: the zone of the nearest large city in the same country
// (MIT-licensed `city-timezones`). Country names come from the runtime (Intl.DisplayNames), in
// English like the rest of the stored data. Loaded once, on first use, on the server only.

import { normalizeTimeZone } from "@/domain/time";

export type Country = { code: string; name: string };
export type CityMatch = { name: string; timeZone: string | null };

type City = { name: string; key: string; pop: number; lat: number; lng: number };
type Zone = { lat: number; lng: number; timeZone: string };

type Index = {
  countries: Country[];
  byName: Map<string, Country>;
  cities: Map<string, City[]>; // by country code, most populous first, one entry per name
  zones: Map<string, Zone[]>; // by country code
};

let index: Promise<Index> | null = null;

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

async function load(): Promise<Index> {
  const [{ default: all }, tz] = await Promise.all([import("all-the-cities"), import("city-timezones")]);
  const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });

  const cities = new Map<string, City[]>();
  for (const c of all) {
    const list = cities.get(c.country) ?? [];
    list.push({ name: c.name, key: fold(c.name), pop: c.population, lng: c.loc.coordinates[0], lat: c.loc.coordinates[1] });
    cities.set(c.country, list);
  }
  for (const [code, list] of cities) {
    list.sort((a, b) => b.pop - a.pop);
    const seen = new Set<string>();
    cities.set(
      code,
      list.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true))),
    );
  }

  const countries: Country[] = [];
  for (const code of cities.keys()) {
    const name = names.of(code);
    if (name && name !== code) countries.push({ code, name });
  }
  countries.sort((a, b) => a.name.localeCompare(b.name, "en"));

  const zones = new Map<string, Zone[]>();
  for (const z of tz.cityMapping) {
    if (!z.timezone) continue;
    const list = zones.get(z.iso2) ?? [];
    list.push({ lat: Number(z.lat), lng: Number(z.lng), timeZone: z.timezone });
    zones.set(z.iso2, list);
  }
  return { countries, byName: new Map(countries.map((c) => [fold(c.name), c])), cities, zones };
}

function getIndex(): Promise<Index> {
  index ??= load();
  return index;
}

export async function listCountries(): Promise<Country[]> {
  return (await getIndex()).countries;
}

/** The country with exactly this name (accents and case ignored), or null. */
export async function findCountry(name: string): Promise<Country | null> {
  return (await getIndex()).byName.get(fold(name)) ?? null;
}

function zoneFor(idx: Index, code: string, city: City): string | null {
  const zones = idx.zones.get(code);
  if (!zones?.length) return null;
  let best = zones[0];
  let bestD = Infinity;
  const cos = Math.cos((city.lat * Math.PI) / 180);
  for (const z of zones) {
    const d = (z.lat - city.lat) ** 2 + ((z.lng - city.lng) * cos) ** 2;
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  return normalizeTimeZone(best.timeZone);
}

/** Cities of a country starting with (then containing) the typed text, largest first. */
export async function searchCities(countryName: string, query: string, limit = 8): Promise<CityMatch[]> {
  const idx = await getIndex();
  const country = idx.byName.get(fold(countryName));
  const q = fold(query);
  if (!country || q.length < 2) return [];
  const list = idx.cities.get(country.code) ?? [];
  const starts = list.filter((c) => c.key.startsWith(q));
  const contains = starts.length >= limit ? [] : list.filter((c) => !c.key.startsWith(q) && c.key.includes(q));
  return [...starts, ...contains].slice(0, limit).map((c) => ({ name: c.name, timeZone: zoneFor(idx, country.code, c) }));
}

/** The city with exactly this name in that country (accents and case ignored), or null. */
export async function findCity(countryName: string, cityName: string): Promise<CityMatch | null> {
  const idx = await getIndex();
  const country = idx.byName.get(fold(countryName));
  if (!country) return null;
  const key = fold(cityName);
  const city = (idx.cities.get(country.code) ?? []).find((c) => c.key === key);
  return city ? { name: city.name, timeZone: zoneFor(idx, country.code, city) } : null;
}

/**
 * The time zones used in a country (from the city time-zone list), or null when the list has
 * none for it (then any zone is accepted). Names as stored ("Asia/Kolkata", not "Asia/Calcutta").
 */
export async function timeZonesOfCountry(countryName: string): Promise<string[] | null> {
  const idx = await getIndex();
  const country = idx.byName.get(fold(countryName));
  const zones = country ? idx.zones.get(country.code) : undefined;
  if (!zones?.length) return null;
  return [...new Set(zones.map((z) => normalizeTimeZone(z.timeZone)))].sort();
}
