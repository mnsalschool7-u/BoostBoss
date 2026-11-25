import {
  compareQuotes,
  buyerCharge,
  dimensionalWeight,
} from "./calculations.mjs";
const $ = (s) => document.querySelector(s);
const shipmentForm = $("#shipment-form"),
  quoteForm = $("#quote-form"),
  feeForm = $("#fee-form");
let quotes = [],
  demo = false,
  compared = false,
  nextId = 1;
const money = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const data = (form) => Object.fromEntries(new FormData(form));
const date = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
function error(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}
function setFields(form, values) {
  Object.entries(values).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (input) input.value = value;
  });
}
function validShipment() {
  if (!shipmentForm.reportValidity()) return false;
  const s = data(shipmentForm);
  if (s.deadline < s.shipDate) {
    error("#shipment-error", "Delivery must be on or after the ship date.");
    return false;
  }
  error("#shipment-error", "");
  return true;
}
function calculateFees() {
  const f = data(feeForm),
    total = buyerCharge(f);
  $("#buyer-charge").textContent = total === null ? "Check fees" : money(total);
  $("#fee-detail").textContent =
    total === null
      ? "Fees plus target margin must be less than 100%, and all costs must be nonnegative."
      : "Formula: (label + packaging + allocated fixed fees) ÷ (1 − fee rates − target margin).";
}
function packaging() {
  const s = data(shipmentForm),
    weight = dimensionalWeight(s);
  const tips = [];
  const missing = ["length", "width", "height", "weight"].filter(
    (k) => !Number(s[k]),
  );
  if (missing.length)
    tips.push(
      "Still needed: packed " +
        missing.join(", ") +
        ". No precise box recommendation is available.",
    );
  if (weight)
    tips.push(
      "Illustrative dimensional weight: " +
        weight.dim +
        " lb. Estimated billable weight: " +
        weight.billable +
        " lb using divisor " +
        s.divisor +
        ". Carrier rounding and rules may differ.",
    );
  if (s.fragility !== "Standard")
    tips.push(
      "Protect each item separately, prevent movement and contact, and assess whether double boxing is needed. Test the packed parcel before buying a label.",
    );
  if (Number(s.items) > 1)
    tips.push(
      "For multiple items, use dividers or individual inner packaging. Compare separate parcels if one box cannot safely carry the combined load.",
    );
  if (Number(s.value) > 500)
    tips.push(
      "Check declared value coverage, exclusions for fragile goods, and signature options for this order.",
    );
  if (demo)
    tips.push(
      "Historical scenario: three stone urns, approximately 24 lb of product before packaging. Actual packed weight and measurements are unknown.",
    );
  $("#packaging-advice").innerHTML =
    tips.map((t) => "<li>" + escape(t) + "</li>").join("") ||
    "<li>Enter packed dimensions and weight to assess this parcel.</li>";
}
function render() {
  const s = data(shipmentForm),
    result = compareQuotes(quotes, compared ? s : {});
  $("#quote-count").textContent = quotes.length + " quotes";
  $("#mode-notice").textContent = demo
    ? "ILLUSTRATIVE HISTORICAL DEMO • Stafford, VA → Las Vegas, NV • Prices and arrival dates below are invented examples, not historical receipts or live quotes. Before November 24 means delivery by November 23."
    : "Manual comparison • Prices and arrival dates are entered by you. Verify the carrier commitment and all charges before purchasing.";
  $("#quotes-body").innerHTML =
    result.ranked
      .map(
        (q) =>
          '<tr class="' +
          (result.best?.id === q.id ? "best" : "") +
          '"><td>' +
          escape(q.provider) +
          "<small>" +
          escape(q.service) +
          "</small><small>" +
          {
            demo: "Illustrative sample",
            manual: "User entered quote",
            estimate: "User estimate",
          }[q.basis] +
          "</small></td><td>" +
          money(q.price) +
          "</td><td>" +
          date(q.arrival) +
          '</td><td><span class="badge ' +
          (q.status === "eligible" ? "" : "warn") +
          '">' +
          {
            eligible: "Meets date",
            late: "Too late",
            invalid: "Before ship date",
            uncompared: "Compare to check",
          }[q.status] +
          '</span></td><td><button class="remove" data-remove="' +
          q.id +
          '" aria-label="Remove ' +
          escape(q.provider + " " + q.service) +
          '">×</button></td></tr>',
      )
      .join("") ||
    '<tr><td colspan="5" class="empty">Add carrier or marketplace quotes below.</td></tr>';
  if (compared) {
    const best = result.best;
    $("#recommendation").innerHTML = best
      ? '<div class="result-banner results-update"><div><span class="eyebrow">' +
        (demo
          ? "ILLUSTRATIVE RECOMMENDATION"
          : "LOWEST ENTERED QUOTE MEETING YOUR DATE") +
        "</span><h2>" +
        escape(best.provider) +
        "</h2><p>" +
        escape(best.service) +
        " · Expected " +
        date(best.arrival) +
        "</p><p>" +
        (result.savings > 0
          ? "Save " +
            money(result.savings) +
            " versus the highest priced qualifying option."
          : "No cheaper qualifying option in this comparison.") +
        "</p><p>Based on " +
        (demo ? "sample dates" : "entered dates") +
        '. Delivery is not guaranteed by Pequod.</p></div><strong class="big-number">' +
        money(best.price) +
        "</strong></div>"
      : '<div class="surface empty"><h3>' +
        (quotes.length
          ? "No quote meets this deadline."
          : "Add your first quote.") +
        "</h3><p>" +
        (quotes.length
          ? "Try another service or review your delivery date."
          : "Use quotes from your carrier or label marketplace to build the shortlist.") +
        "</p></div>";
    if (best) feeForm.elements.label.value = best.price.toFixed(2);
  }
  calculateFees();
  packaging();
}
shipmentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validShipment()) return;
  compared = true;
  render();
});
shipmentForm.addEventListener("input", () => {
  // Existing quotes no longer describe a changed shipment. Clear them rather than silently reusing stale prices.
  if (quotes.length) {
    quotes = [];
    compared = false;
    demo = false;
    $("#recommendation").innerHTML =
      '<div class="surface empty"><h3>Shipment updated.</h3><p>Add fresh quotes for these shipment details.</p></div>';
    feeForm.elements.label.value = 0;
  }
  render();
});
quoteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validShipment()) return;
  if (demo) {
    error(
      "#quote-error",
      "Start a new shipment before entering real quotes. Illustrative and real rates are kept separate.",
    );
    return;
  }
  const q = data(quoteForm),
    s = data(shipmentForm);
  if (q.arrival < s.shipDate) {
    error("#quote-error", "Arrival cannot precede the ship date.");
    return;
  }
  error("#quote-error", "");
  quotes.push({ ...q, id: nextId++, price: Number(q.price) });
  compared = true;
  quoteForm.reset();
  render();
});
$("#quotes-body").addEventListener("click", (e) => {
  const button = e.target.closest("[data-remove]");
  if (!button) return;
  quotes = quotes.filter((q) => q.id !== Number(button.dataset.remove));
  feeForm.elements.label.value = 0;
  render();
});
feeForm.addEventListener("input", calculateFees);
$("#load-demo").addEventListener("click", () => {
  shipmentForm.reset();
  quoteForm.reset();
  error("#quote-error", "");
  error("#shipment-error", "");
  setFields(shipmentForm, {
    origin: "22554",
    destination: "89135",
    shipDate: "2026-11-20",
    deadline: "2026-11-23",
    items: 3,
    fragility: "Very fragile",
    platform: "Etsy",
    value: 525,
    length: "",
    width: "",
    height: "",
    weight: "",
  });
  // Deliberately illustrative rates, never represented as a real API or historical quote.
  quotes = [
    {
      provider: "Pirate Ship",
      service: "UPS 2nd Day Air",
      price: 92,
      arrival: "2026-11-24",
    },
    {
      provider: "Etsy Shipping Labels",
      service: "UPS Next Day Air",
      price: 148,
      arrival: "2026-11-23",
    },
    {
      provider: "UPS",
      service: "Next Day Air",
      price: 196,
      arrival: "2026-11-23",
    },
    {
      provider: "FedEx",
      service: "Priority Overnight",
      price: 184,
      arrival: "2026-11-23",
    },
    {
      provider: "USPS",
      service: "Priority Mail estimate",
      price: 104,
      arrival: "2026-11-25",
    },
  ].map((q) => ({ ...q, id: nextId++, basis: "demo" }));
  setFields(feeForm, {
    packaging: 18,
    marketFee: 6.5,
    paymentFee: 3,
    fixedFee: 0.45,
    margin: 10,
  });
  demo = true;
  compared = true;
  $("#quote-details").open = false;
  render();
});
$("#reset").addEventListener("click", () => {
  quotes = [];
  demo = false;
  compared = false;
  shipmentForm.reset();
  quoteForm.reset();
  feeForm.reset();
  error("#quote-error", "");
  error("#shipment-error", "");
  $("#quote-details").open = true;
  $("#recommendation").innerHTML =
    '<div class="surface empty"><h3>Your deadline sets the shortlist.</h3><p>Add shipment details and quotes to compare your options.</p></div>';
  render();
});
render();
