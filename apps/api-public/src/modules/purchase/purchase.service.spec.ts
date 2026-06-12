import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { PurchaseService } from "./purchase.service";

type StoreItem = Record<string, unknown>;

const baseItem: StoreItem = {
  id: "item_1",
  title: "Vinyl album",
  imageUrl: null,
  category: "MERCH",
  quality: "EPIC",
  priceMode: "POINTS",
  priceAmountCents: null,
  currencyCode: null,
  pointsPrice: 100,
  loyaltyPoints: 0,
  stockCount: 10,
  salesStartAt: null,
};

function setup(item: StoreItem, balance: number) {
  const tx = {
    artistStoreItem: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    artistPurchase: { create: vi.fn().mockResolvedValue({ id: "purchase_1" }) },
    artistPointsTransaction: { create: vi.fn().mockResolvedValue({}) },
    artistInventoryItem: { create: vi.fn().mockResolvedValue({ id: "inv_1" }) },
  };
  const prisma = {
    artistStoreItem: { findFirst: vi.fn().mockResolvedValue(item) },
    artistUser: {
      findFirst: vi
        .fn()
        .mockResolvedValue({ id: "au_1", artistId: "art_1", user: { email: "nova@fans.local" } }),
    },
    $transaction: vi.fn((cb: (t: typeof tx) => unknown) => Promise.resolve(cb(tx))),
  };
  const points = {
    getBalance: vi.fn().mockResolvedValue(balance),
    getMyLeaderboardEntry: vi.fn().mockResolvedValue({ points: balance - 100, rank: 3 }),
  };
  const mailer = { sendPurchaseConfirmation: vi.fn().mockResolvedValue(undefined) };
  const bus = { publish: vi.fn().mockResolvedValue(undefined) };
  const service = new PurchaseService(
    prisma as never,
    points as never,
    mailer as never,
    bus as never,
  );
  return { service, prisma, tx, points, bus };
}

describe("PurchaseService.purchase", () => {
  it("points purchase: decrements stock, writes a negative POINTS_SPEND ledger entry, snapshots inventory, emits activity", async () => {
    const { service, tx, bus } = setup(baseItem, 500);

    const result = await service.purchase("u_1", "aurora", "item_1");

    expect(tx.artistStoreItem.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stockCount: { decrement: 1 } } }),
    );
    expect(tx.artistPointsTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: -100, kind: "POINTS_SPEND" }) as unknown,
    });
    expect(tx.artistInventoryItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ storeItemId: "item_1", title: "Vinyl album" }) as unknown,
      }),
    );
    expect(bus.publish).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ newBalance: 400, newRank: 3 });
  });

  it("also credits loyalty points when the item awards them", async () => {
    const { service, tx } = setup({ ...baseItem, loyaltyPoints: 50 }, 500);

    await service.purchase("u_1", "aurora", "item_1");

    expect(tx.artistPointsTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 50, kind: "PURCHASE_REWARD" }) as unknown,
    });
  });

  it("rejects when the buyer can't afford it — no transaction runs", async () => {
    const { service, prisma } = setup(baseItem, 50); // balance 50 < price 100

    await expect(service.purchase("u_1", "aurora", "item_1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a sold-out item before charging or granting anything", async () => {
    const { service, prisma } = setup({ ...baseItem, stockCount: 0 }, 500);

    await expect(service.purchase("u_1", "aurora", "item_1")).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
