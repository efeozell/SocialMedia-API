import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
    rules: {
      "no-unused-vars": "warn", // Kullanılmayan değişken
      "no-console": "warn", // console.log uyarısı
      eqeqeq: "error", // == yerine ===
      curly: "error", // if/for için süslü parantez
      "no-undef": "error", // Tanımlanmamış değişken
    },
  },
]);
