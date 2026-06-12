// Text-field length limits for admin forms — client-side mirror of the
// api-admin DTO validators (the server is the other end of the same contract;
// keep them in sync). Used for `maxLength` + the live character counter.

export const HOME_SECTION_TITLE_MAX = 120;
export const HOME_SECTION_SUBTITLE_MAX = 300;

// RULES section items (spec §7: max 5 rules per artist).
export const RULE_TITLE_MAX = 30;
export const RULE_BODY_MAX = 90;
export const RULE_ITEMS_MAX = 5;

// Social platforms an artist can offer (mirror of api-admin ARTIST_SOCIAL_LINK_LIMIT).
export const SOCIAL_LINKS_MAX = 6;
