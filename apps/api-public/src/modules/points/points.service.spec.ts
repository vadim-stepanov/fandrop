import { describe, expect, it, vi } from "vitest";

import { PointsService } from "./points.service";

// Pure unit tests — PrismaService is hand-mocked, no DB. Validates the
// ledger-sum invariant (balance = SUM(ledger), never a stored column).
function makePrismaMock() {
  return {
    artistPointsTransaction: { aggregate: vi.fn() },
    artistUser: { findFirst: vi.fn() },
  };
}

describe("PointsService", () => {
  it("getBalance returns the ledger sum", async () => {
    const prisma = makePrismaMock();
    prisma.artistPointsTransaction.aggregate.mockResolvedValue({ _sum: { amount: 1250 } });
    const service = new PointsService(prisma as never);

    await expect(service.getBalance("au_1")).resolves.toBe(1250);
    expect(prisma.artistPointsTransaction.aggregate).toHaveBeenCalledWith({
      where: { artistUserId: "au_1" },
      _sum: { amount: true },
    });
  });

  it("getBalance returns 0 when the member has no ledger entries", async () => {
    const prisma = makePrismaMock();
    prisma.artistPointsTransaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const service = new PointsService(prisma as never);

    await expect(service.getBalance("au_1")).resolves.toBe(0);
  });

  it("getBalanceForUserAndArtist short-circuits to 0 without a membership", async () => {
    const prisma = makePrismaMock();
    prisma.artistUser.findFirst.mockResolvedValue(null);
    const service = new PointsService(prisma as never);

    await expect(service.getBalanceForUserAndArtist("u_1", "aurora")).resolves.toBe(0);
    expect(prisma.artistPointsTransaction.aggregate).not.toHaveBeenCalled();
  });
});
