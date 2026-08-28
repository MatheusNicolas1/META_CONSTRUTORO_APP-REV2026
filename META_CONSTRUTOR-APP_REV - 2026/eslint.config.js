import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import metaConstrutor from "./scripts/eslint-plugin-no-unsourced-claims.mjs";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "output",
      "test-results",
      ".agent",
      ".agents",
      ".playwright-cli",
      "MetaConstrutor",
      "MetaConstrutor/**",
      "temp_*.ts",
      "*.tsbuildinfo",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "meta-construtor": metaConstrutor,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // PREVENÇÃO FALSO-036/055/056: claims numéricas/social-proof sem fonte.
      // SEMPRE "warn" — nunca "error" (o bloqueio acontece no CI via
      // scripts/check-unsourced-claims.mjs, não no lint padrão).
      "meta-construtor/no-unsourced-claims": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-case-declarations": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "no-useless-catch": "off",
      "prefer-const": "off",
      "prefer-spread": "off",
    },
  }
);
