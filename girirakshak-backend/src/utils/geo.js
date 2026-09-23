// Haversine distance in kilometres between two lat/lng points.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Finds the nearest risk zone to a lat/lng — used to auto-tag citizen
// reports with the zone they most likely belong to. With a real MongoDB
// deployment, swap this for RiskZone.find().near({ center: ... }) using the
// 2dsphere index already defined on the model.
export function findNearestZone(zones, lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const zone of zones) {
    const d = distanceKm(lat, lng, zone.lat, zone.lng);
    if (d < minDist) {
      minDist = d;
      nearest = zone;
    }
  }
  return nearest ? { zone: nearest, distanceKm: Math.round(minDist * 10) / 10 } : null;
}
