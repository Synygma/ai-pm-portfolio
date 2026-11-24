"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { normalizeTimeZone } from "@/domain/time";

// Country, city and time-zone pickers. Only real countries and cities can be chosen (the server
// checks again on save). Picking a city also suggests its time zone.

type Country = { code: string; name: string };
export type CityMatch = { name: string; timeZone: string | null };
type FieldProps = { id: string; "aria-invalid": boolean; "aria-describedby"?: string };

const selectClass =
  "min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-3 text-base outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30 aria-[invalid=true]:border-red-600";

let countriesPromise: Promise<Country[]> | null = null;
function loadCountries(): Promise<Country[]> {
  countriesPromise ??= fetch("/api/places")
    .then((r) => r.json() as Promise<{ countries: Country[] }>)
    .then((d) => d.countries)
    .catch(() => {
      countriesPromise = null;
      return [];
    });
  return countriesPromise;
}

export function CountrySelect({ field, value, onChange }: { field: FieldProps; value: string; onChange: (name: string) => void }) {
  const t = useTranslations("places");
  const [countries, setCountries] = useState<Country[] | null>(null);
  useEffect(() => {
    let live = true;
    void loadCountries().then((c) => live && setCountries(c));
    return () => {
      live = false;
    };
  }, []);
  // India first: ParCare's parents live there (India-only launch).
  const ordered = useMemo(() => {
    if (!countries) return [];
    const india = countries.find((c) => c.code === "IN");
    return india ? [india, ...countries.filter((c) => c !== india)] : countries;
  }, [countries]);
  const known = !value || ordered.some((c) => c.name === value);
  return (
    <select {...field} className={selectClass} value={value} onChange={(e) => onChange(e.target.value)} data-testid="country-select">
      <option value="">{countries ? t("chooseCountry") : t("loading")}</option>
      {!known && <option value={value}>{value}</option>}
      {ordered.map((c) => (
        <option key={c.code} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Type-ahead from the world city list of the chosen country. The matches are a visible list of
 * buttons under the field (a browser "datalist" often shows nothing on phones). Picking one fills
 * in the city and its time zone.
 */
export function CityInput({
  field,
  country,
  value,
  onChange,
  onPick,
}: {
  field: FieldProps;
  country: string;
  value: string;
  onChange: (name: string) => void;
  onPick?: (city: CityMatch) => void;
}) {
  const t = useTranslations("places");
  // Results for one search (country + text), so stale ones are never shown for new text.
  const [result, setResult] = useState<{ key: string; cities: CityMatch[] } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const q = value.trim();
  const key = `${country}|${q.toLowerCase()}`;

  useEffect(() => {
    if (!country || q.length < 2) return;
    const ctl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/places?country=${encodeURIComponent(country)}&q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json() as Promise<{ cities: CityMatch[] }>)
        .then((d) => {
          setResult({ key, cities: d.cities });
          // Typed exactly (e.g. "Lucknow"): counts as picked, and fills in the time zone.
          const exact = d.cities.find((c) => c.name.toLowerCase() === q.toLowerCase());
          if (exact) {
            setPicked(exact.name);
            onPick?.(exact);
          }
        })
        .catch(() => undefined);
    }, 200);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
    // onPick changes every render; the lookup depends only on the typed text and country.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, q]);

  const cities = result?.key === key ? result.cities : null;
  const isPicked = picked !== null && picked.toLowerCase() === q.toLowerCase();
  const showList = !isPicked && q.length >= 2 && cities !== null;

  function pick(city: CityMatch) {
    setPicked(city.name);
    onChange(city.name);
    onPick?.(city);
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        {...field}
        className={selectClass}
        autoComplete="off"
        disabled={!country}
        placeholder={country ? t("cityPlaceholder") : t("countryFirst")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="city-input"
      />
      {showList && cities.length > 0 && (
        <ul className="overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-sm" data-testid="city-suggestions">
          {cities.map((c) => (
            <li key={c.name} className="border-b border-neutral-200 last:border-b-0">
              <button type="button" className="min-h-12 w-full px-3 text-left text-base hover:bg-[#e7f5f1]" onClick={() => pick(c)}>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {showList && cities.length === 0 && (
        <p className="text-sm text-red-800" data-testid="city-none">
          {t("noCity", { country })}
        </p>
      )}
      {isPicked && (
        <p className="text-sm text-[#008069]" data-testid="city-ok">
          {t("cityOk")}
        </p>
      )}
    </div>
  );
}

/** Every IANA time zone, grouped by region, as a real list (not free text). The list comes from
 *  the browser after the page loads (server and browser lists differ slightly). */
export function TimeZoneSelect({
  field,
  value,
  onChange,
  name,
  country,
}: {
  field: FieldProps;
  value: string;
  onChange?: (tz: string) => void;
  /** Set for a plain form submit (uncontrolled). */
  name?: string;
  /** The chosen country: its zones are listed first, and one that does not fit is flagged. */
  country?: string;
}) {
  const t = useTranslations("places");
  const [groups, setGroups] = useState<[string, string[]][]>([]);
  const [countryZones, setCountryZones] = useState<{ country: string; zones: string[] | null } | null>(null);
  useEffect(() => {
    if (!country) return;
    let live = true;
    fetch(`/api/places?zones=${encodeURIComponent(country)}`)
      .then((r) => r.json() as Promise<{ zones: string[] | null }>)
      .then((d) => live && setCountryZones({ country, zones: d.zones }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [country]);
  const used = country && countryZones?.country === country ? countryZones.zones : null;
  // A country with one time zone (India): fill it in.
  useEffect(() => {
    if (onChange && used?.length === 1 && value !== used[0]) onChange(used[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [used]);
  const mismatch = Boolean(used && value && !used.includes(value));
  useEffect(() => {
    const raw = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Asia/Kolkata", "Europe/London"];
    const zones = [...new Set(raw.map(normalizeTimeZone))].sort();
    const map = new Map<string, string[]>();
    for (const z of zones) {
      const region = z.includes("/") ? z.split("/")[0] : "Other";
      map.set(region, [...(map.get(region) ?? []), z]);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGroups([...map.entries()]);
  }, []);
  const all = groups.flatMap(([, z]) => z);
  return (
    <>
    <select
      // Uncontrolled (plain form): remount once the list has loaded so the saved zone is selected.
      // The key goes before the spread so React treats the options as fixed children.
      key={onChange ? undefined : `${value}-${all.length}`}
      {...field}
      name={name}
      className={selectClass}
      value={onChange ? value : undefined}
      defaultValue={onChange ? undefined : value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      data-testid="timezone-select"
    >
      <option value="">{t("chooseTimeZone")}</option>
      {value && !all.includes(value) && <option value={value}>{value.replaceAll("_", " ")}</option>}
      {used && used.length > 0 && (
        <optgroup label={t("usedIn", { country: country ?? "" })}>
          {used.map((z) => (
            <option key={`used-${z}`} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </optgroup>
      )}
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replaceAll("_", " ")}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
    {mismatch && (
      <p role="alert" className="text-sm text-red-800" data-testid="timezone-mismatch">
        {t("zoneNotInCountry", { country: country ?? "" })}
      </p>
    )}
    </>
  );
}
