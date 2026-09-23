import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const f = (["views", "widgets", "features", "entities", "shared"]).map(
  (type) => ({ type, pattern: `src/${type}/**` }),
);

const anyLayer = {
  types: { anyOf: ["views", "widgets", "features", "entities", "shared"] },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // FSD boundary enforcement (views → widgets → features → entities → shared).
  // Imports are only allowed top-down; anything else is disallowed by default.
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": f,
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "views" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["views", "widgets", "features", "entities", "shared"],
                    },
                  },
                },
              },
            },
            {
              from: { element: { type: "widgets" } },
              allow: {
                to: { element: { types: { anyOf: ["widgets", "features", "entities", "shared"] } } },
              },
            },
            {
              from: { element: { type: "features" } },
              allow: {
                to: { element: { types: { anyOf: ["features", "entities", "shared"] } } },
              },
            },
            {
              from: { element: { type: "entities" } },
              allow: { to: { element: { types: { anyOf: ["entities", "shared"] } } } },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            // External and builtin modules (react, next, @domly/*, ...) are allowed from every layer.
            { from: { element: anyLayer }, allow: { to: { module: { origin: "external" } } } },
            { from: { element: anyLayer }, allow: { to: { module: { origin: "builtin" } } } },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
