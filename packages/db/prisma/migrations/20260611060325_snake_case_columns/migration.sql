-- Rename to snake_case columns/tables + enum types (data-preserving).

ALTER TYPE "ArtistRole" RENAME TO "artist_role";
ALTER TYPE "AuditAction" RENAME TO "audit_action";
ALTER TYPE "AuditEntityType" RENAME TO "audit_entity_type";
ALTER TYPE "StoreCategory" RENAME TO "store_category";
ALTER TYPE "StoreQuality" RENAME TO "store_quality";
ALTER TYPE "StorePriceMode" RENAME TO "store_price_mode";
ALTER TYPE "ArtistHomeSectionKey" RENAME TO "artist_home_section_key";
ALTER TYPE "ArtistPointsTransactionKind" RENAME TO "artist_points_transaction_kind";
ALTER TYPE "QuestStatus" RENAME TO "quest_status";

ALTER TABLE "Artist" RENAME TO "artists";
ALTER TABLE "artists" RENAME COLUMN "logoUrl" TO "logo_url";
ALTER TABLE "artists" RENAME COLUMN "referralEnabled" TO "referral_enabled";
ALTER TABLE "artists" RENAME COLUMN "referralRewardPoints" TO "referral_reward_points";
ALTER TABLE "artists" RENAME COLUMN "signupBonusPoints" TO "signup_bonus_points";
ALTER TABLE "artists" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artists" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistUser" RENAME TO "artist_users";
ALTER TABLE "artist_users" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "artist_users" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "artist_users" RENAME COLUMN "hasSeenOnboarding" TO "has_seen_onboarding";
ALTER TABLE "artist_users" RENAME COLUMN "referralCode" TO "referral_code";
ALTER TABLE "artist_users" RENAME COLUMN "referredByArtistUserId" TO "referred_by_artist_user_id";
ALTER TABLE "artist_users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_users" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistAdminGrant" RENAME TO "artist_admin_grants";
ALTER TABLE "artist_admin_grants" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "artist_admin_grants" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "AuditLog" RENAME TO "audit_logs";
ALTER TABLE "audit_logs" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "audit_logs" RENAME COLUMN "adminUserId" TO "admin_user_id";
ALTER TABLE "audit_logs" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "audit_logs" RENAME COLUMN "entityType" TO "entity_type";
ALTER TABLE "audit_logs" RENAME COLUMN "entityId" TO "entity_id";
ALTER TABLE "audit_logs" RENAME COLUMN "beforePayload" TO "before_payload";
ALTER TABLE "audit_logs" RENAME COLUMN "afterPayload" TO "after_payload";

ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "users" RENAME COLUMN "googleSub" TO "google_sub";
ALTER TABLE "users" RENAME COLUMN "avatarUrl" TO "avatar_url";
ALTER TABLE "users" RENAME COLUMN "googleAvatarUrl" TO "google_avatar_url";
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistStoreItem" RENAME TO "artist_store_items";
ALTER TABLE "artist_store_items" RENAME COLUMN "sectionId" TO "section_id";
ALTER TABLE "artist_store_items" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "artist_store_items" RENAME COLUMN "priceMode" TO "price_mode";
ALTER TABLE "artist_store_items" RENAME COLUMN "priceAmountCents" TO "price_amount_cents";
ALTER TABLE "artist_store_items" RENAME COLUMN "currencyCode" TO "currency_code";
ALTER TABLE "artist_store_items" RENAME COLUMN "pointsPrice" TO "points_price";
ALTER TABLE "artist_store_items" RENAME COLUMN "loyaltyPoints" TO "loyalty_points";
ALTER TABLE "artist_store_items" RENAME COLUMN "stockCount" TO "stock_count";
ALTER TABLE "artist_store_items" RENAME COLUMN "leftAlert" TO "left_alert";
ALTER TABLE "artist_store_items" RENAME COLUMN "salesStartAt" TO "sales_start_at";
ALTER TABLE "artist_store_items" RENAME COLUMN "featuredPos" TO "featured_pos";
ALTER TABLE "artist_store_items" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_store_items" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_store_items" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistHomeSection" RENAME TO "artist_home_sections";
ALTER TABLE "artist_home_sections" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "artist_home_sections" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_home_sections" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "artist_home_sections" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_home_sections" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistRuleItem" RENAME TO "artist_rule_items";
ALTER TABLE "artist_rule_items" RENAME COLUMN "sectionId" TO "section_id";
ALTER TABLE "artist_rule_items" RENAME COLUMN "stepNumber" TO "step_number";
ALTER TABLE "artist_rule_items" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_rule_items" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_rule_items" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistPromoVariant" RENAME TO "artist_promo_variants";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "sectionId" TO "section_id";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "ctaLabel" TO "cta_label";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "ctaUrl" TO "cta_url";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "ctaText" TO "cta_text";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "bannerUrl" TO "banner_url";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "videoUrl" TO "video_url";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "bannerUrlAnon" TO "banner_url_anon";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "timerEndsAt" TO "timer_ends_at";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_promo_variants" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistPartnerItem" RENAME TO "artist_partner_items";
ALTER TABLE "artist_partner_items" RENAME COLUMN "sectionId" TO "section_id";
ALTER TABLE "artist_partner_items" RENAME COLUMN "logoUrl" TO "logo_url";
ALTER TABLE "artist_partner_items" RENAME COLUMN "externalUrl" TO "external_url";
ALTER TABLE "artist_partner_items" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_partner_items" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "artist_partner_items" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_partner_items" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistLeaderboardConfig" RENAME TO "artist_leaderboard_configs";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "topExpandedCount" TO "top_expanded_count";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "visibleUserCount" TO "visible_user_count";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "expandedByDefault" TO "expanded_by_default";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_leaderboard_configs" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistInventoryItem" RENAME TO "artist_inventory_items";
ALTER TABLE "artist_inventory_items" RENAME COLUMN "artistUserId" TO "artist_user_id";
ALTER TABLE "artist_inventory_items" RENAME COLUMN "purchaseId" TO "purchase_id";
ALTER TABLE "artist_inventory_items" RENAME COLUMN "storeItemId" TO "store_item_id";
ALTER TABLE "artist_inventory_items" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "artist_inventory_items" RENAME COLUMN "acquiredAt" TO "acquired_at";

ALTER TABLE "ArtistPointsTransaction" RENAME TO "artist_points_transactions";
ALTER TABLE "artist_points_transactions" RENAME COLUMN "artistUserId" TO "artist_user_id";
ALTER TABLE "artist_points_transactions" RENAME COLUMN "adminUserId" TO "admin_user_id";
ALTER TABLE "artist_points_transactions" RENAME COLUMN "hiddenAt" TO "hidden_at";
ALTER TABLE "artist_points_transactions" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "ArtistPurchase" RENAME TO "artist_purchases";
ALTER TABLE "artist_purchases" RENAME COLUMN "artistUserId" TO "artist_user_id";
ALTER TABLE "artist_purchases" RENAME COLUMN "storeItemId" TO "store_item_id";
ALTER TABLE "artist_purchases" RENAME COLUMN "priceMode" TO "price_mode";
ALTER TABLE "artist_purchases" RENAME COLUMN "pointsSpent" TO "points_spent";
ALTER TABLE "artist_purchases" RENAME COLUMN "amountCents" TO "amount_cents";
ALTER TABLE "artist_purchases" RENAME COLUMN "currencyCode" TO "currency_code";
ALTER TABLE "artist_purchases" RENAME COLUMN "loyaltyAwarded" TO "loyalty_awarded";
ALTER TABLE "artist_purchases" RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "ArtistQuest" RENAME TO "artist_quests";
ALTER TABLE "artist_quests" RENAME COLUMN "sectionId" TO "section_id";
ALTER TABLE "artist_quests" RENAME COLUMN "imageUrl" TO "image_url";
ALTER TABLE "artist_quests" RENAME COLUMN "rewardPoints" TO "reward_points";
ALTER TABLE "artist_quests" RENAME COLUMN "availableAt" TO "available_at";
ALTER TABLE "artist_quests" RENAME COLUMN "featuredPos" TO "featured_pos";
ALTER TABLE "artist_quests" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_quests" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_quests" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistUserQuest" RENAME TO "artist_user_quests";
ALTER TABLE "artist_user_quests" RENAME COLUMN "artistUserId" TO "artist_user_id";
ALTER TABLE "artist_user_quests" RENAME COLUMN "questId" TO "quest_id";
ALTER TABLE "artist_user_quests" RENAME COLUMN "startedAt" TO "started_at";
ALTER TABLE "artist_user_quests" RENAME COLUMN "completedAt" TO "completed_at";
ALTER TABLE "artist_user_quests" RENAME COLUMN "claimedAt" TO "claimed_at";
ALTER TABLE "artist_user_quests" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_user_quests" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "SocialPlatform" RENAME TO "social_platforms";
ALTER TABLE "social_platforms" RENAME COLUMN "isActive" TO "is_active";
ALTER TABLE "social_platforms" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "social_platforms" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistSocialLink" RENAME TO "artist_social_links";
ALTER TABLE "artist_social_links" RENAME COLUMN "artistId" TO "artist_id";
ALTER TABLE "artist_social_links" RENAME COLUMN "socialPlatformId" TO "social_platform_id";
ALTER TABLE "artist_social_links" RENAME COLUMN "connectBonus" TO "connect_bonus";
ALTER TABLE "artist_social_links" RENAME COLUMN "sortOrder" TO "sort_order";
ALTER TABLE "artist_social_links" RENAME COLUMN "isVisible" TO "is_visible";
ALTER TABLE "artist_social_links" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "artist_social_links" RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "ArtistUserSocialConnection" RENAME TO "artist_user_social_connections";
ALTER TABLE "artist_user_social_connections" RENAME COLUMN "artistUserId" TO "artist_user_id";
ALTER TABLE "artist_user_social_connections" RENAME COLUMN "artistSocialLinkId" TO "artist_social_link_id";
ALTER TABLE "artist_user_social_connections" RENAME COLUMN "externalHandleOrUrl" TO "external_handle_or_url";
ALTER TABLE "artist_user_social_connections" RENAME COLUMN "connectedAt" TO "connected_at";
ALTER TABLE "artist_user_social_connections" RENAME COLUMN "createdAt" TO "created_at";

