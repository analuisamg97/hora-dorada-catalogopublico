const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0
});

export function formatMoney(value) {
  return `${moneyFormatter.format(Number(value) || 0)} MXN`;
}

export function formatCompactMoney(value) {
  return moneyFormatter.format(Number(value) || 0);
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}
