import { defineConfig } from "orval";

export default defineConfig({
  admin: {
    input: "../api-admin/openapi.json",
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/model",
      client: "react-query",
      httpClient: "axios",
      prettier: true,
      override: {
        mutator: {
          path: "src/lib/orval-mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});
