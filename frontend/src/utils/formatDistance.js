export function formatDistance(distanceKm) {
  if (distanceKm == null) return ''
  const meters = distanceKm * 1000
  if (meters < 1000) {
    return `${Math.round(meters / 50) * 50} ม.`
  }
  return `${distanceKm.toFixed(1)} กม.`
}
