// @ts-check
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// Next.js app (web-public). eslint-config-next bundles JS/TS/React/Next rules.
// Prettier last. Consumers add their own `ignores`.
export default [...nextVitals, ...nextTs, eslintConfigPrettier];
