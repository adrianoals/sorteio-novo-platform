import assert from "node:assert/strict";
import test from "node:test";
import { compareDrawResults } from "./draw-result-order";

test("ordena por bloco e depois por apartamento", () => {
  const rows = [
    { blockName: "Torre 2", apartmentNumber: "11" },
    { blockName: "Torre 1", apartmentNumber: "101" },
    { blockName: "Torre 1", apartmentNumber: "21" },
    { blockName: "Torre 2", apartmentNumber: "2" },
  ];

  assert.deepEqual([...rows].sort(compareDrawResults), [
    { blockName: "Torre 1", apartmentNumber: "21" },
    { blockName: "Torre 1", apartmentNumber: "101" },
    { blockName: "Torre 2", apartmentNumber: "2" },
    { blockName: "Torre 2", apartmentNumber: "11" },
  ]);
});

test("condomínio sem blocos continua ordenado pelo apartamento", () => {
  const rows = [
    { apartmentNumber: "100" },
    { apartmentNumber: "9" },
  ];
  assert.deepEqual([...rows].sort(compareDrawResults), [
    { apartmentNumber: "9" },
    { apartmentNumber: "100" },
  ]);
});
