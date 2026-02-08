export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function toInt(value) {
  return Number.parseInt(value, 10) || 0;
}