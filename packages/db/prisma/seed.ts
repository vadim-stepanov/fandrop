import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
if (!process.env.DATABASE_URL) {
  process.loadEnvFile(rootEnv);
}

// Imported after the env is loaded — the client builds its adapter at module init.
const { prisma } = await import("../src/client");
const { homeSectionDefaults } = await import("../src/home-sections");

const demoUsers = [
  { email: "ava.stone@fandrop.local" },
  { email: "leo.park@fandrop.local" },
  { email: "mia.rivera@fandrop.local" },
];

for (const user of demoUsers) {
  await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: user,
  });
}

console.log(`Seeded ${demoUsers.length} demo users`);

// Backfill Home section shells for every existing artist (idempotent via the
// [artistId, key] unique). New artists get these at creation in ArtistService.
const artists = await prisma.artist.findMany({ select: { id: true } });
for (const artist of artists) {
  await prisma.artistHomeSection.createMany({
    data: homeSectionDefaults.map((section) => ({ ...section, artistId: artist.id })),
    skipDuplicates: true,
  });
}

console.log(`Ensured Home sections for ${artists.length} artist(s)`);

// Fake members with point balances — data for the balance widget + leaderboard.
// Idempotent: each member gets a single seed ledger entry only if they have none.
const fakeFans = [
  { email: "nova@fans.local", points: 4200 },
  { email: "echo@fans.local", points: 3850 },
  { email: "pixel@fans.local", points: 3320 },
  { email: "lumen@fans.local", points: 2740 },
  { email: "vega@fans.local", points: 2190 },
  { email: "orion@fans.local", points: 1680 },
  { email: "sol@fans.local", points: 1230 },
  { email: "indra@fans.local", points: 870 },
  { email: "kairo@fans.local", points: 540 },
  { email: "wren@fans.local", points: 260 },
];

for (const artist of artists) {
  for (const fan of fakeFans) {
    const user = await prisma.user.upsert({
      where: { email: fan.email },
      update: {},
      create: { email: fan.email },
    });
    const member = await prisma.artistUser.upsert({
      where: { artistId_userId: { artistId: artist.id, userId: user.id } },
      update: {},
      create: { artistId: artist.id, userId: user.id, role: "USER" },
    });
    const existing = await prisma.artistPointsTransaction.count({
      where: { artistUserId: member.id },
    });
    if (existing === 0) {
      await prisma.artistPointsTransaction.create({
        data: {
          artistUserId: member.id,
          amount: fan.points,
          kind: "ADMIN_ADJUSTMENT",
          description: "Seed balance",
        },
      });
    }
  }
}

console.log(`Ensured ${fakeFans.length} fake members (+ balances) per artist`);

// Demo quests in the QUESTS section (idempotent: only if the section has none).
// imageUrl left null on purpose to exercise the placeholder. One Coming-Soon
// (future availableAt) + four featured (Home teaser) + one plain.
const demoQuests = [
  {
    title: "Watch the official trailer",
    description: "See the full album trailer",
    link: "https://www.youtube.com",
    rewardPoints: 50,
    featuredPos: 1,
  },
  {
    title: "Join the community chat",
    description: "Say hi to other fans",
    link: "https://discord.com",
    rewardPoints: 100,
    featuredPos: 2,
  },
  {
    title: "Follow on Spotify",
    description: "Add the latest single",
    link: "https://open.spotify.com",
    rewardPoints: 75,
    featuredPos: 3,
  },
  {
    title: "Share your referral code",
    description: "Invite a friend to join",
    link: "https://fandrop.local",
    rewardPoints: 120,
    featuredPos: 4,
  },
  {
    title: "Comment on the latest video",
    description: "Join the conversation",
    link: "https://www.youtube.com",
    rewardPoints: 40,
    featuredPos: 0,
  },
  {
    title: "Pre-save the upcoming drop",
    description: "Unlocks soon",
    link: "https://fandrop.local",
    rewardPoints: 200,
    featuredPos: 0,
    availableAt: new Date(Date.now() + 1000 * 60 * 60 * 72),
  },
];

for (const artist of artists) {
  const questsSection = await prisma.artistHomeSection.findUnique({
    where: { artistId_key: { artistId: artist.id, key: "QUESTS" } },
    select: { id: true },
  });
  if (!questsSection) {
    continue;
  }
  const existing = await prisma.artistQuest.count({ where: { sectionId: questsSection.id } });
  if (existing === 0) {
    await prisma.artistQuest.createMany({
      data: demoQuests.map((quest) => ({ ...quest, sectionId: questsSection.id })),
    });
  }
}

console.log(`Ensured demo quests per artist`);

// Global social-platform catalog (icon = public/brand-icons/<icon>.svg).
const socialPlatforms = [
  { slug: "instagram", label: "Instagram", icon: "instagram" },
  { slug: "x", label: "X", icon: "x" },
  { slug: "tiktok", label: "TikTok", icon: "tiktok" },
  { slug: "spotify", label: "Spotify", icon: "spotify" },
  { slug: "apple-music", label: "Apple Music", icon: "apple-music" },
  { slug: "youtube", label: "YouTube", icon: "youtube" },
  { slug: "facebook", label: "Facebook", icon: "facebook" },
];
for (const platform of socialPlatforms) {
  await prisma.socialPlatform.upsert({
    where: { slug: platform.slug },
    update: { label: platform.label, icon: platform.icon },
    create: platform,
  });
}
console.log(`Seeded ${socialPlatforms.length} social platforms`);

await prisma.$disconnect();
