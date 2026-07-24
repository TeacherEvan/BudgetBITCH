import { describe, it, expect } from 'vitest';
import { haversineKm, resolveVicinityFeeds, getRegionForCountry } from './vicinity-resolver';
import type { VicinityFeed, Tier } from './vicinity-registry';
type VicinityFeedWithMeta = VicinityFeed & { distanceKm: number; tier: Tier };

describe('vicinity-resolver', () => {
  describe('haversineKm', () => {
    it('calculates Bangkok to Pattaya distance correctly (~130km)', () => {
      const dist = haversineKm(13.7563, 100.5018, 12.9236, 100.8825);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(150);
    });

    it('calculates Bangkok to Phuket distance correctly (~680km)', () => {
      const dist = haversineKm(13.7563, 100.5018, 7.8861, 98.3926);
      expect(dist).toBeGreaterThan(650);
      expect(dist).toBeLessThan(750);
    });
  });

  describe('resolveVicinityFeeds', () => {
    it('returns feeds for Bangkok with correct tier ordering', () => {
      const feeds = resolveVicinityFeeds(13.7563, 100.5018, 'TH');

      // Should have city feeds first (Bangkok)
      const cityFeeds = feeds.filter((f) => f.tier === 'city');
      expect(cityFeeds.length).toBeGreaterThan(0);

      // Should have country feeds
      const countryFeeds = feeds.filter((f) => f.tier === 'country');
      expect(countryFeeds.length).toBeGreaterThan(0);

      // Should have region feeds (SEA)
      const regionFeeds = feeds.filter((f) => f.tier === 'region');
      expect(regionFeeds.length).toBeGreaterThan(0);

      // Should have global fallback
      const globalFeeds = feeds.filter((f) => f.tier === 'global');
      expect(globalFeeds.length).toBeGreaterThan(0);

      // Test tier ordering: city < province < country < region < global
      const firstCity = feeds.findIndex((f) => f.tier === 'city');
      const firstProvince = feeds.findIndex((f) => f.tier === 'province');
      const firstCountry = feeds.findIndex((f) => f.tier === 'country');
      const firstRegion = feeds.findIndex((f) => f.tier === 'region');
      const firstGlobal = feeds.findIndex((f) => f.tier === 'global');

      expect(firstCity).toBeLessThan(firstCountry);
      expect(firstCountry).toBeLessThan(firstRegion);
      expect(firstRegion).toBeLessThan(firstGlobal);
      if (firstProvince >= 0) {
        expect(firstCity).toBeLessThan(firstProvince);
        expect(firstProvince).toBeLessThan(firstCountry);
      }
    });

    it('caps feeds at 12 max', () => {
      const feeds = resolveVicinityFeeds(13.7563, 100.5018, 'TH');
      expect(feeds.length).toBeLessThanOrEqual(12);
    });

    it('sorts by tier first, then distance, then priority, then reliability', () => {
      const feeds = resolveVicinityFeeds(13.7563, 100.5018, 'TH');
      
      // Within same tier, should be sorted by distance then priority
      const cityFeeds = feeds.filter((f) => f.tier === 'city');
      if (cityFeeds.length > 1) {
        for (let i = 1; i < cityFeeds.length; i++) {
          expect(cityFeeds[i].distanceKm).toBeGreaterThanOrEqual(cityFeeds[i - 1].distanceKm);
        }
      }
    });
  });

  describe('getRegionForCountry', () => {
    it('returns SEA for TH', () => {
      expect(getRegionForCountry('TH')).toBe('SEA');
    });

    it('returns NA for US', () => {
      expect(getRegionForCountry('US')).toBe('NA');
    });

    it('returns EU for GB', () => {
      expect(getRegionForCountry('GB')).toBe('EU');
    });

    it('returns null for unknown country', () => {
      expect(getRegionForCountry('XX')).toBeNull();
    });

    it('returns null for null input', () => {
      expect(getRegionForCountry(null)).toBeNull();
    });
  });
});