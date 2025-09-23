import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"], languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  pluginReact.configs.flat.recommended,
];
