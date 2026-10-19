import assert from "node:assert/strict";

const { certificateCardLabel } = await import("../lib/certificate-cards.ts");
const { certificateIdFromChain, compareCertificateState } = await import("../lib/certificate-compare.ts");

const wallet = "Wallet11111111111111111111111111111111111";
const other = "Other222222222222222222222222222222222222";
const asset = "Asset111111111111111111111111111111111111";

const added = compareCertificateState(
  [],
  [{ certificateId: "saving-habit", assetAddress: asset, ownerAddress: wallet }],
  [],
);
assert.equal(added.length, 1);
assert.equal(added[0]?.status, "owned");
assert.equal(added[0]?.assetAddress, asset);

const transferred = compareCertificateState(
  [{ certificateId: "saving-habit", status: "owned", assetAddress: asset, ownerAddress: wallet }],
  [],
  [{ certificateId: "saving-habit", assetAddress: asset, ownerAddress: other }],
);
assert.equal(transferred.length, 1);
assert.equal(transferred[0]?.status, "transferred");
assert.equal(transferred[0]?.assetAddress, asset);
assert.equal(transferred[0]?.ownerAddress, other);

const same = compareCertificateState(
  [{ certificateId: "saving-habit", status: "owned", assetAddress: asset, ownerAddress: wallet }],
  [{ certificateId: "saving-habit", assetAddress: asset, ownerAddress: wallet }],
  [],
);
assert.equal(same.length, 0);

const unreadable = compareCertificateState(
  [{ certificateId: "saving-habit", status: "owned", assetAddress: asset, ownerAddress: wallet }],
  [],
  [],
);
assert.equal(unreadable.length, 0);

assert.equal(certificateIdFromChain("Coach FI - Saving Habit", "Saving Habit"), "saving-habit");
assert.equal(certificateIdFromChain("Other", "Saving Habit"), null);

assert.equal(certificateCardLabel(false, null, true), "ready");
assert.equal(certificateCardLabel(false, null, false), "locked");
assert.equal(certificateCardLabel(false, "owned", true), "minted");
assert.equal(certificateCardLabel(true, "transferred", true), "transferred");

console.log("certificate compare checks passed");
