import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDrawAssignments,
  type DrawApartment,
  type DrawSpot,
} from "./draw-engine-s1-core";

const apartment = (
  id: string,
  overrides: Partial<DrawApartment> = {}
): DrawApartment => ({
  id,
  rights: ["simple"],
  allowedSubsolos: null,
  allowedBlocks: null,
  specialEligibility: [],
  ...overrides,
});

const spot = (id: string, overrides: Partial<DrawSpot> = {}): DrawSpot => ({
  id,
  spotType: "simple",
  basement: null,
  blockId: null,
  apartmentId: null,
  specialType: "normal",
  ...overrides,
});

test("a mesma seed produz exatamente o mesmo resultado", () => {
  const apartments = [apartment("a1"), apartment("a2"), apartment("a3")];
  const spots = [spot("s1"), spot("s2"), spot("s3")];

  assert.deepEqual(
    calculateDrawAssignments(apartments, spots, "seed-auditavel"),
    calculateDrawAssignments(apartments, spots, "seed-auditavel")
  );
});

test("cada tipo de direito recebe somente uma vaga compatível", () => {
  const results = calculateDrawAssignments(
    [apartment("a1", { rights: ["simple", "double"] })],
    [spot("simples"), spot("dupla", { spotType: "double" })],
    "tipos"
  );

  assert.deepEqual(new Set(results.map((result) => result.spotId)), new Set(["simples", "dupla"]));
});

test("respeita simultaneamente restrições de subsolo e bloco", () => {
  const results = calculateDrawAssignments(
    [
      apartment("a1", {
        allowedSubsolos: ["SS1"],
        allowedBlocks: ["bloco-a"],
      }),
    ],
    [
      spot("subsolo-errado", { basement: "SS2", blockId: "bloco-a" }),
      spot("bloco-errado", { basement: "SS1", blockId: "bloco-b" }),
      spot("elegivel", { basement: "SS1", blockId: "bloco-a" }),
    ],
    "restricoes"
  );

  assert.deepEqual(results, [{ apartmentId: "a1", spotId: "elegivel" }]);
});

test("vaga pré-atribuída fica fora do pool e desconta apenas seu tipo", () => {
  const results = calculateDrawAssignments(
    [apartment("a1", { rights: ["double", "simple"] })],
    [
      spot("travada", { apartmentId: "a1" }),
      spot("livre-simples"),
      spot("livre-dupla", { spotType: "double" }),
    ],
    "pre-atribuida"
  );

  assert.deepEqual(results, [{ apartmentId: "a1", spotId: "livre-dupla" }]);
});

test("escassez de vagas gera resultado parcial sem duplicar vaga", () => {
  const results = calculateDrawAssignments(
    [apartment("a1"), apartment("a2"), apartment("a3")],
    [spot("unica")],
    "escassez"
  );

  assert.equal(results.length, 1);
  assert.equal(new Set(results.map((result) => result.spotId)).size, 1);
});

test("não atribui vagas quando nenhuma é elegível", () => {
  const results = calculateDrawAssignments(
    [apartment("a1", { rights: ["double"] })],
    [spot("simples")],
    "sem-match"
  );

  assert.deepEqual(results, []);
});

test("apartamento PNE recebe somente vaga PNE", () => {
  const results = calculateDrawAssignments(
    [apartment("apt-pne", { specialEligibility: ["pne"] })],
    [
      spot("normal"),
      spot("pne", { specialType: "pne" }),
    ],
    "pne"
  );

  assert.deepEqual(results, [{ apartmentId: "apt-pne", spotId: "pne" }]);
});

test("apartamento comum não recebe vaga PNE", () => {
  const results = calculateDrawAssignments(
    [apartment("apt-comum")],
    [spot("pne", { specialType: "pne" })],
    "normal"
  );

  assert.deepEqual(results, []);
});
