const integerFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const mantissaFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

// Long-scale roots for 10^(6k). Each 10^(6k+3) step is "mil <plural>".
const LONG_SCALE: readonly (readonly [singular: string, plural: string])[] = [
  ["millón", "millones"],
  ["billón", "billones"],
  ["trillón", "trillones"],
  ["cuatrillón", "cuatrillones"],
  ["quintillón", "quintillones"],
];

function scaleWord(exponent: number, mantissa: number): string {
  const root = LONG_SCALE[Math.floor((exponent - 6) / 6)];
  if (!root) return `e${exponent}`;
  const [singular, plural] = root;
  if (exponent % 6 === 3) return `mil ${plural}`;
  return mantissa === 1 ? singular : plural;
}

export function formatCroquetas(n: number): string {
  if (n < 1_000_000) return integerFormat.format(Math.floor(n));
  let exponent = Math.floor(Math.log10(n) / 3) * 3;
  let mantissa = Number((n / 10 ** exponent).toPrecision(3));
  if (mantissa >= 1000) {
    exponent += 3;
    mantissa /= 1000;
  }
  return `${mantissaFormat.format(mantissa)} ${scaleWord(exponent, mantissa)}`;
}

const cpsFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

export function formatCps(n: number): string {
  if (n < 1000) return cpsFormat.format(Math.floor(n * 10) / 10);
  return formatCroquetas(n);
}
