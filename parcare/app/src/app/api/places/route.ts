import { type NextRequest, NextResponse } from "next/server";
import { listCountries, searchCities, timeZonesOfCountry } from "@/data/places";

// Country list (no parameters), city suggestions (?country=India&q=luck) and a country's time
// zones (?zones=India), for the pickers in
// setup and Settings. Public reference data only; nothing about the family is read or stored.
export async function GET(request: NextRequest) {
  const country = request.nextUrl.searchParams.get("country")?.slice(0, 80) ?? "";
  const q = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
  const cache = { "Cache-Control": "public, max-age=86400" };
  const zonesOf = request.nextUrl.searchParams.get("zones")?.slice(0, 80);
  if (zonesOf) return NextResponse.json({ zones: await timeZonesOfCountry(zonesOf) }, { headers: cache });
  if (!country) return NextResponse.json({ countries: await listCountries() }, { headers: cache });
  return NextResponse.json({ cities: await searchCities(country, q) }, { headers: cache });
}
