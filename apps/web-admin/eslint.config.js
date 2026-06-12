import react from "@fandrop/eslint-config/react";

export default [
  { ignores: ["dist", "src/api/generated"] },
  ...react,
  {
    // TanStack Router routes export `Route`, shadcn/ui components export
    // variant helpers (e.g. buttonVariants), shared building-blocks
    // (field-label kit) and feature components (store-bits) export helpers
    // alongside components — the fast-refresh rule doesn't fit any of these.
    files: [
      "src/routes/**/*.tsx",
      "src/components/ui/**/*.tsx",
      "src/components/feedback/**/*.tsx",
      "src/components/*.tsx",
      "src/features/**/*.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];
