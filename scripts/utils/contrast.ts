/* WCAG 2.x relative luminance and the ratio over it, and there is no colour-space conversion in
 * here on purpose: color-mix(in oklab, C N%, transparent) returns C at alpha N, because a mix
 * against transparent happens on premultiplied components and transparent premultiplies to
 * nothing. So a held-back ink is an alpha the compositor blends on the encoded channels, and the
 * lerp that measures one lands with the first ratio the contract carries. */

export type Rgb = [number, number, number];

const linear = (channel: number) => (channel <= 0.04045
  ? channel / 12.92
  : ((channel + 0.055) / 1.055) ** 2.4);

export function luminance([r, g, b]: Rgb) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrast(a: Rgb, b: Rgb) {
  const [high, low] = [luminance(a), luminance(b)].sort((one, other) => other - one);
  return (high + 0.05) / (low + 0.05);
}
