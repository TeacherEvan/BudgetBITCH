import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { claimLocalDataOwner } from "./data-owner";
import { addBill, getAllBills, clearAllData } from "./local-db";

describe("claimLocalDataOwner (guards regression: cross-user local data mixing)", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it("adopts legacy data for the first identity", async () => {
    await addBill({ id: "b1" } as never);
    expect(await claimLocalDataOwner("userA")).toBe("claimed");
    expect(await getAllBills()).toHaveLength(1);
  });

  it("keeps data for the same identity", async () => {
    await claimLocalDataOwner("userA");
    await addBill({ id: "b1" } as never);
    expect(await claimLocalDataOwner("userA")).toBe("unchanged");
    expect(await getAllBills()).toHaveLength(1);
  });

  it("wipes data when a different identity signs in", async () => {
    await claimLocalDataOwner("userA");
    await addBill({ id: "b1" } as never);
    expect(await claimLocalDataOwner("userB")).toBe("switched");
    expect(await getAllBills()).toHaveLength(0);
  });
});
