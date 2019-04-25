export function getParameterByName(name: string, url?: string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function clamp(value: number, min: number, max: number): number {
  if (value === Infinity) {
    console.warn('clamp: value is Infinity, returning `max`', value);
    return max;
  }
  if (value === -Infinity) {
    console.warn('clamp: value is -Infinity, returning `min`', value);
    return min;
  }
  if (!Number.isFinite(value)) {
    console.warn('clamp: value isn\'t finite, returning `min`', value);
    return min
  }

  if (value < min) return min;
  if (value > max) return max;
  return value;
}
