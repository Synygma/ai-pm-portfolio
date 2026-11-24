declare module "all-the-cities" {
  const cities: {
    cityId: number;
    name: string;
    altName: string;
    /** ISO 3166-1 alpha-2, e.g. "IN". */
    country: string;
    featureCode: string;
    adminCode: string;
    population: number;
    loc: { type: "Point"; coordinates: [number, number] };
  }[];
  export default cities;
}
