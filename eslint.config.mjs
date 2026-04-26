import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const reactHooks = require(
  path.join(
    __dirname,
    "node_modules",
    "eslint-config-next",
    "node_modules",
    "eslint-plugin-react-hooks"
  )
);

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "supabase/**",
      "scripts/**",
      "designs/**",
      "public/**",
    ],
  },
  ...tseslint.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["tailwind.config.ts", "*.config.{ts,js,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
