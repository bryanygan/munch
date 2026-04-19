import { countryToRegion, COUNTRY_TO_REGION } from '@/data/cuisineRegions';

describe('countryToRegion', () => {
  it('maps known countries', () => {
    expect(countryToRegion('TH')).toBe('southeast_asian');
    expect(countryToRegion('JP')).toBe('east_asian');
    expect(countryToRegion('IT')).toBe('mediterranean');
    expect(countryToRegion('US')).toBe('north_american');
  });

  it('returns undefined for unknown country', () => {
    expect(countryToRegion('ZZ')).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(countryToRegion('th')).toBe('southeast_asian');
  });

  it('contains all countries from the mapping', () => {
    expect(Object.keys(COUNTRY_TO_REGION).length).toBeGreaterThan(30);
  });
});
