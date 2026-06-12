import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { QuestsService } from "./quests.service";

// Unit tests for the claim flow — Prisma ($transaction) and the event bus are
// hand-mocked. Focus: the COMPLETED→CLAIMED transition is idempotent and credits
// the reward exactly once via the ledger.
function setup(userQuest: unknown) {
  const tx = {
    artistUserQuest: {
      findUnique: vi.fn().mockResolvedValue(userQuest),
      update: vi.fn().mockResolvedValue({}),
    },
    artistPointsTransaction: { create: vi.fn().mockResolvedValue({}) },
  };
  const prisma = {
    artistUser: { findFirst: vi.fn().mockResolvedValue({ id: "au_1", artistId: "art_1" }) },
    $transaction: vi.fn((cb: (t: typeof tx) => unknown) => Promise.resolve(cb(tx))),
  };
  const bus = { publish: vi.fn().mockResolvedValue(undefined) };
  const service = new QuestsService(prisma as never, bus as never);
  return { service, prisma, tx, bus };
}

describe("QuestsService.claim", () => {
  it("claims a COMPLETED quest: credits points once, marks CLAIMED, emits activity", async () => {
    const { service, tx, bus } = setup({
      id: "uq_1",
      status: "COMPLETED",
      quest: { rewardPoints: 100, title: "Follow on Spotify" },
    });

    const result = await service.claim("u_1", "aurora", "q_1");

    expect(result).toEqual({ claimed: true, amount: 100 });
    expect(tx.artistPointsTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        artistUserId: "au_1",
        amount: 100,
        kind: "QUEST_REWARD",
      }) as unknown,
    });
    expect(tx.artistUserQuest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "uq_1" },
        data: expect.objectContaining({ status: "CLAIMED" }) as unknown,
      }),
    );
    expect(bus.publish).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: re-claiming an already-CLAIMED quest is a no-op", async () => {
    const { service, tx, bus } = setup({
      id: "uq_1",
      status: "CLAIMED",
      quest: { rewardPoints: 100, title: "X" },
    });

    const result = await service.claim("u_1", "aurora", "q_1");

    expect(result).toEqual({ claimed: false, amount: 0 });
    expect(tx.artistPointsTransaction.create).not.toHaveBeenCalled();
    expect(tx.artistUserQuest.update).not.toHaveBeenCalled();
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it("rejects a non-member before touching the ledger", async () => {
    const { service, prisma, tx } = setup(null);
    prisma.artistUser.findFirst.mockResolvedValue(null);

    await expect(service.claim("u_x", "aurora", "q_1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.artistPointsTransaction.create).not.toHaveBeenCalled();
  });
});

// Snapshot test: locks the public quest view-model the API hands to the client
// (the per-member `status` is derived from userQuests). Inline snapshot — the
// expected shape lives in the test and shows up in review diffs.
describe("QuestsService.listQuests view-model", () => {
  it("maps rows to the public quest shape (status derived per member)", async () => {
    const prisma = {
      artistUser: { findFirst: vi.fn().mockResolvedValue({ id: "au_1", artistId: "art_1" }) },
      artistQuest: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "q_1",
            title: "Follow on Spotify",
            description: "Add the latest single",
            link: "https://open.spotify.com",
            imageUrl: null,
            rewardPoints: 75,
            availableAt: null,
            userQuests: [{ status: "COMPLETED" }],
          },
          {
            id: "q_2",
            title: "Watch the trailer",
            description: null,
            link: "https://youtu.be/x",
            imageUrl: "/img/q2.png",
            rewardPoints: 50,
            availableAt: null,
            userQuests: [],
          },
        ]),
      },
    };
    const service = new QuestsService(prisma as never, { publish: vi.fn() } as never);

    const result = await service.listQuests("u_1", "aurora");

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "availableAt": null,
          "description": "Add the latest single",
          "id": "q_1",
          "imageUrl": null,
          "link": "https://open.spotify.com",
          "rewardPoints": 75,
          "status": "COMPLETED",
          "title": "Follow on Spotify",
        },
        {
          "availableAt": null,
          "description": null,
          "id": "q_2",
          "imageUrl": "/img/q2.png",
          "link": "https://youtu.be/x",
          "rewardPoints": 50,
          "status": "NOT_STARTED",
          "title": "Watch the trailer",
        },
      ]
    `);
  });
});
