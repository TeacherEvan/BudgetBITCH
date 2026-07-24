import { VicinityFeed, TIERED_FEED_REGISTRY } from './vicinity-registry';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

type Tier = 'city' | 'province' | 'country' | 'region' | 'global';

export function getRegionForCountry(country: string | null): keyof typeof TIERED_FEED_REGISTRY.region | null {
  if (!country) return null;
  const regions: Record<string, keyof typeof TIERED_FEED_REGISTRY.region> = {
    TH: 'SEA', SG: 'SEA', MY: 'SEA', PH: 'SEA', ID: 'SEA', VN: 'SEA', MM: 'SEA', KH: 'SEA', LA: 'SEA',
    US: 'NA', CA: 'NA', MX: 'NA',
    GB: 'EU', DE: 'EU', FR: 'EU', IT: 'EU', ES: 'EU', NL: 'EU',
    AU: 'OCEANIA', NZ: 'OCEANIA',
    CN: 'EAST_ASIA', JP: 'EAST_ASIA', KR: 'EAST_ASIA', TW: 'EAST_ASIA', HK: 'EAST_ASIA',
    IN: 'SOUTH_ASIA', PK: 'SOUTH_ASIA', BD: 'SOUTH_ASIA',
    BR: 'LATAM', AR: 'LATAM', CL: 'LATAM', CO: 'LATAM',
    AE: 'MENA', SA: 'MENA', QA: 'MENA', KW: 'MENA',
    ZA: 'AFRICA', NG: 'AFRICA', KE: 'AFRICA', EG: 'AFRICA',
  };
  return regions[country] || null;
}

export function resolveVicinityFeeds(userLat: number, userLon: number, userCountry: string | null): Array<VicinityFeed & { distanceKm: number; tier: Tier }> {
  const qualified: Array<VicinityFeed & { distanceKm: number; tier: Tier }> = [];

  // 1. City feeds (exact match by proximity)
  for (const feed of TIERED_FEED_REGISTRY.city) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'city' });
  }

  // 2. Province feeds
  for (const feed of TIERED_FEED_REGISTRY.province) {
    const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
    if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'province' });
  }

  // 3. Country feeds
  if (userCountry && TIERED_FEED_REGISTRY.country[userCountry]) {
    for (const feed of TIERED_FEED_REGISTRY.country[userCountry]) {
      const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
      if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'country' });
    }
  }

  // 4. Region feeds (neighboring countries)
  const region = getRegionForCountry(userCountry);
  if (region && TIERED_FEED_REGISTRY.region[region]) {
    for (const countryCode of TIERED_FEED_REGISTRY.region[region]) {
      if (countryCode === userCountry) continue; // already added
      for (const feed of TIERED_FEED_REGISTRY.country[countryCode] || []) {
        const dist = haversineKm(userLat, userLon, feed.center.lat, feed.center.lon);
        if (dist <= feed.radiusKm) qualified.push({ ...feed, distanceKm: dist, tier: 'region' });
      }
    }
  }

  // 5. Global fallback
  for (const feed of TIERED_FEED_REGISTRY.global) {
    qualified.push({ ...feed, distanceKm: 99999, tier: 'global' });
  }

  // Sort: tier order > distance > priority > reliability
  const tierOrder = { city: 0, province: 1, country: 2, region: 3, global: 4 };
  return qualified.sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.reliability - a.reliability;
  }).slice(0, 12); // Cap at 12 feeds max
}