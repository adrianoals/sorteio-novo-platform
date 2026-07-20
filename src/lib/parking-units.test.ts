import assert from "node:assert/strict";
import test from "node:test";
import {
  findPhysicalSpotConflict,
  formatParkingUnitLabel,
  getPhysicalSpotLocationGroups,
} from "./parking-units";

test("formata grupo com suas vagas físicas", () => {
  assert.equal(formatParkingUnitLabel("Grupo 27", "group", ["16", "122", "123"]), "Grupo 27 - Vagas: (16, 122, 123)");
});

test("mantém o número original para vaga individual", () => {
  assert.equal(formatParkingUnitLabel("16", "individual", []), "16");
});

test("detecta vaga física já usada por outro grupo e ignora a própria unidade", () => {
  const units = [{ id: "a", physicalSpots: ["16", "122"] }, { id: "b", physicalSpots: ["123"] }];
  assert.equal(findPhysicalSpotConflict(["122"], units), "122");
  assert.equal(findPhysicalSpotConflict(["122"], units, "a"), null);
});

test("agrupa vagas físicas por pavimento preservando a ordem", () => {
  assert.deepEqual(
    getPhysicalSpotLocationGroups(["445", "446", "345"], {
      physicalSpotLocations: {
        "445": "Pavimento 1",
        "446": "Pavimento 1",
        "345": "Pavimento 2",
      },
    }),
    [
      { location: "Pavimento 1", spots: ["445", "446"] },
      { location: "Pavimento 2", spots: ["345"] },
    ]
  );
});
