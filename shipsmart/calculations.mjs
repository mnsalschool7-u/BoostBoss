// Pure calculations shared by the interface and tests. No carrier rates are fabricated here.
export function classifyQuote(quote, shipment) {
  if (!shipment.shipDate || !shipment.deadline) return "uncompared";
  if (quote.arrival < shipment.shipDate) return "invalid";
  return quote.arrival <= shipment.deadline ? "eligible" : "late";
}
export function compareQuotes(quotes, shipment) {
  const ranked = quotes.map((q) => ({
    ...q,
    status: classifyQuote(q, shipment),
  }));
  ranked.sort(
    (a, b) =>
      (a.status === "eligible" ? 0 : 1) - (b.status === "eligible" ? 0 : 1) ||
      a.price - b.price,
  );
  const eligible = ranked.filter((q) => q.status === "eligible");
  return {
    ranked,
    best: eligible[0] || null,
    savings: eligible.length
      ? Math.max(...eligible.map((q) => q.price)) - eligible[0].price
      : 0,
  };
}
export function buyerCharge({
  label,
  packaging,
  marketFee,
  paymentFee,
  fixedFee,
  margin,
}) {
  const values = [
    label,
    packaging,
    marketFee,
    paymentFee,
    fixedFee,
    margin,
  ].map(Number);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return null;
  const denominator =
    1 - (Number(marketFee) + Number(paymentFee) + Number(margin)) / 100;
  if (denominator <= 0) return null;
  return (
    Math.ceil(
      ((Number(label) + Number(packaging) + Number(fixedFee)) / denominator) *
        100,
    ) / 100
  );
}
export function dimensionalWeight({ length, width, height, weight, divisor }) {
  const values = [length, width, height, weight, divisor].map(Number);
  if (values.some((v) => !Number.isFinite(v) || v <= 0)) return null;
  const dim = Math.ceil(
    (Number(length) * Number(width) * Number(height)) / Number(divisor),
  );
  return { dim, billable: Math.max(dim, Math.ceil(Number(weight))) };
}
