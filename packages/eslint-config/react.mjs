// @ts-check
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

// React + Vite SPA (web-admin). Type-unaware lint (matches the app's setup),
// scoped to TS/TSX. Consumers add their own `ignores` + per-file relaxations.
export default tseslint.config({
  files: ["**/*.{ts,tsx}"],
  extends: [
    eslint.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
    eslintConfigPrettier,
  ],
  languageOptions: {
    globals: { ...globals.browser },
  },
});
