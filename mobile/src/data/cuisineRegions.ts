import type { CountryCode, CuisineRegion } from '@/domain/dish/types';

export const COUNTRY_TO_REGION: Record<string, CuisineRegion> = {
  // East Asian
  JP: 'east_asian', KR: 'east_asian', CN: 'east_asian', TW: 'east_asian',
  HK: 'east_asian', MN: 'east_asian',
  // Southeast Asian
  TH: 'southeast_asian', VN: 'southeast_asian', ID: 'southeast_asian',
  PH: 'southeast_asian', MY: 'southeast_asian', SG: 'southeast_asian',
  KH: 'southeast_asian', LA: 'southeast_asian', MM: 'southeast_asian',
  // South Asian
  IN: 'south_asian', PK: 'south_asian', BD: 'south_asian',
  LK: 'south_asian', NP: 'south_asian',
  // Middle Eastern
  LB: 'middle_eastern', IL: 'middle_eastern', IR: 'middle_eastern',
  TR: 'middle_eastern', SY: 'middle_eastern', JO: 'middle_eastern',
  AE: 'middle_eastern', SA: 'middle_eastern', IQ: 'middle_eastern',
  // African
  NG: 'african', ET: 'african', EG: 'african', MA: 'african',
  ZA: 'african', KE: 'african', GH: 'african', SN: 'african',
  // Mediterranean
  GR: 'mediterranean', IT: 'mediterranean', ES: 'mediterranean',
  // Western European
  FR: 'western_european', DE: 'western_european', GB: 'western_european',
  NL: 'western_european', BE: 'western_european', IE: 'western_european',
  PT: 'western_european', CH: 'western_european', AT: 'western_european',
  // Eastern European
  RU: 'eastern_european', PL: 'eastern_european', HU: 'eastern_european',
  RO: 'eastern_european', CZ: 'eastern_european', UA: 'eastern_european',
  // Nordic
  SE: 'nordic', NO: 'nordic', FI: 'nordic', DK: 'nordic', IS: 'nordic',
  // North American
  US: 'north_american', CA: 'north_american', MX: 'north_american',
  // Latin American
  BR: 'latin_american', AR: 'latin_american', PE: 'latin_american',
  CO: 'latin_american', CL: 'latin_american', CU: 'latin_american',
  DO: 'latin_american', VE: 'latin_american',
  // Oceanic
  AU: 'oceanic', NZ: 'oceanic', FJ: 'oceanic',
};

export const countryToRegion = (country: CountryCode): CuisineRegion | undefined =>
  COUNTRY_TO_REGION[country.toUpperCase()];
