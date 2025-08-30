/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate ETA based on distance and average speed
 */
export function calculateETA(distance: number, averageSpeed: number = 30): number {
  // Return ETA in minutes
  return Math.ceil((distance / averageSpeed) * 60);
}

/**
 * Generate random location within a radius
 */
export function generateRandomLocation(
  centerLat: number,
  centerLon: number,
  radiusKm: number = 5
): { latitude: number; longitude: number } {
  const r = radiusKm / 111.32; // Convert km to degrees (rough approximation)
  const theta = Math.random() * 2 * Math.PI;
  
  const latitude = centerLat + r * Math.cos(theta);
  const longitude = centerLon + r * Math.sin(theta);
  
  return { latitude, longitude };
}