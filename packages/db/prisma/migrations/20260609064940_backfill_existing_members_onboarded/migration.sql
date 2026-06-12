-- Backfill: every member that already exists predates the onboarding feature,
-- so they must not be shown the first-join welcome modal (and must not receive
-- the welcome bonus retroactively). Mark them as having seen onboarding.
-- New members created after this migration are governed by the default (false)
-- and the join-time skip logic in ensureMembership.
UPDATE "ArtistUser" SET "hasSeenOnboarding" = true;