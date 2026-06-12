import next from "@fandrop/eslint-config/next";

const config = [
  ...next,
  // Default ignores of eslint-config-next, re-stated for the flat array.
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
];

export default config;
