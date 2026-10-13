import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // ponytail: set-state-in-effect stays a warning because tabs fetch via setState-in-effect; ceiling = 17 effects. Upgrade: move fetching into a data hook.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // ponytail: GA/GSC payloads are untyped JSON; ceiling = 38 `any`s. Upgrade: type the API responses.
  { rules: { "@typescript-eslint/no-explicit-any": "warn" } },
);
