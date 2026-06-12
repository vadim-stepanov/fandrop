// @ts-check
import nest from "@fandrop/eslint-config/nest";

export default [
  { ignores: ["eslint.config.mjs", "dist"] },
  ...nest,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
