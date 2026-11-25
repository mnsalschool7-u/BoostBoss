import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareQuotes,
  buyerCharge,
  dimensionalWeight,
} from "../shipsmart/calculations.mjs";
test("cheapest late quote cannot win and deadline is inclusive", () => {
  const r = compareQuotes(
    [
      { id: 1, price: 50, arrival: "2026-11-24" },
      { id: 2, price: 148, arrival: "2026-11-23" },
      { id: 3, price: 196, arrival: "2026-11-23" },
    ],
    { shipDate: "2026-11-20", deadline: "2026-11-23" },
  );
  assert.equal(r.best.id, 2);
  assert.equal(r.savings, 48);
});
test("no qualifying service is not a recommendation", () =>
  assert.equal(
    compareQuotes([{ price: 5, arrival: "2026-11-24" }], {
      shipDate: "2026-11-20",
      deadline: "2026-11-23",
    }).best,
    null,
  ));
test("pre shipment arrival is invalid", () =>
  assert.equal(
    compareQuotes([{ price: 5, arrival: "2026-11-19" }], {
      shipDate: "2026-11-20",
      deadline: "2026-11-23",
    }).ranked[0].status,
    "invalid",
  ));
test("fees gross up cost and reject impossible margin", () => {
  assert.equal(
    buyerCharge({
      label: 148,
      packaging: 18,
      marketFee: 6.5,
      paymentFee: 3,
      fixedFee: 0.45,
      margin: 10,
    }),
    206.78,
  );
  assert.equal(
    buyerCharge({
      label: 10,
      packaging: 0,
      marketFee: 50,
      paymentFee: 20,
      fixedFee: 0,
      margin: 30,
    }),
    null,
  );
});
test("missing parcel dimensions never invent dimensional weight", () => {
  assert.equal(
    dimensionalWeight({
      length: "",
      width: 10,
      height: 10,
      weight: 24,
      divisor: 139,
    }),
    null,
  );
  assert.deepEqual(
    dimensionalWeight({
      length: 20,
      width: 20,
      height: 20,
      weight: 24,
      divisor: 139,
    }),
    { dim: 58, billable: 58 },
  );
});
