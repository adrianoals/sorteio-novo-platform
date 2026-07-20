import assert from "node:assert/strict";
import test from "node:test";
import { formatDrawDate, formatDrawDateForFilename } from "./draw-date";

test("formata a data do sorteio no horário de São Paulo", () => {
  assert.equal(
    formatDrawDate("2026-07-20T22:38:17.153Z"),
    "20/07/2026, 19:38:17"
  );
});

test("formata a data do arquivo no horário de São Paulo", () => {
  assert.equal(
    formatDrawDateForFilename("2026-07-21T02:30:00.000Z"),
    "2026-07-20"
  );
});
