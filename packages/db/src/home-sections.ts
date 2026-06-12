import { ArtistHomeSectionKey } from "./generated/prisma/enums";

// The fixed set of Home section shells every artist gets on creation
// (spec §7). Shared so both ArtistService (bootstrap on create) and the
// seed (backfill existing artists) stay in sync.
export const homeSectionDefaults: ReadonlyArray<{
  key: ArtistHomeSectionKey;
  sortOrder: number;
  title: string | null;
}> = [
  { key: ArtistHomeSectionKey.PROMO, sortOrder: 0, title: null },
  { key: ArtistHomeSectionKey.RULES, sortOrder: 1, title: "How it works" },
  { key: ArtistHomeSectionKey.STORE, sortOrder: 2, title: "Store" },
  { key: ArtistHomeSectionKey.LEADERBOARD, sortOrder: 3, title: "Leaderboard" },
  { key: ArtistHomeSectionKey.PARTNERS, sortOrder: 4, title: "Partners" },
  { key: ArtistHomeSectionKey.QUESTS, sortOrder: 5, title: "Quests" },
];
