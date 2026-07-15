import assert from "node:assert/strict";
import test from "node:test";
import { getRemainingSlotTypes } from "./draw-rights";

test("vaga simples pré-atribuída não consome direito a vaga dupla", () => {
  assert.deepEqual(
    getRemainingSlotTypes(["double", "simple"], ["simple"]),
    ["double"]
  );
});

test("vaga dupla pré-atribuída não consome direito a vaga simples", () => {
  assert.deepEqual(
    getRemainingSlotTypes(["simple", "double"], ["double"]),
    ["simple"]
  );
});

test("direitos repetidos são descontados uma vez por vaga compatível", () => {
  assert.deepEqual(
    getRemainingSlotTypes(["simple", "simple", "double"], ["simple"]),
    ["simple", "double"]
  );
});

test("vaga incompatível não elimina demanda pendente", () => {
  assert.deepEqual(getRemainingSlotTypes(["double"], ["simple"]), ["double"]);
});

test("direitos legados continuam compatíveis", () => {
  assert.deepEqual(
    getRemainingSlotTypes(
      ["two_simple" as never, "car" as never],
      ["simple", "simple"]
    ),
    ["simple"]
  );
});
