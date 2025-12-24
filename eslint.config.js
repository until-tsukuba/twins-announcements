import { defineConfig } from "eslint/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import js from "@eslint/js";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {},
        },

        extends: compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),

        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        rules: {},
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },

            sourceType: "script",
            parserOptions: {},
        },

        files: ["**/.eslintrc.{js,cjs}"],
    },
]);
