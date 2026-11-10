import tseslint from "typescript-eslint";

const config = [
  { ignores: ["dist/**"] },
  ...tseslint.configs.recommended,
  { rules: { "@typescript-eslint/no-explicit-any": "error" } },
];
export default config;
