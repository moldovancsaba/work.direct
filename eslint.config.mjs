import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Ignore legacy stubs to avoid lint warnings
      "app/components/games/FindRed.tsx",
      "app/components/games/StarsHexa.tsx",
      "app/components/games/PenaltyGameLayout.tsx",
      "app/components/games/PenaltyCardText.tsx",
      "app/components/games/PenaltyHexa 2.tsx",
      "app/components/games/PenaltyScoreboard 2.tsx",
      "app/components/games/PenaltyShootout 2.tsx",
      "app/components/games/QuizzHexa.tsx",
      "app/components/LuckyWheel.tsx",
      "app/components/WheelOfFortune 2.tsx",
      "app/components/admin/PenaltyCustomizationForm 2.tsx",
      "app/components/admin/PenaltyCustomizationForm 2.tsx.backup",
      "app/components/admin/StarsHexaCustomizationForm 2.tsx",
      "app/lib/wheelGenerator.ts",
    ],
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"]
  }),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "react/no-unescaped-entities": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default eslintConfig;
