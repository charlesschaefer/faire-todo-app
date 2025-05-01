// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const unusedImports = require("eslint-plugin-unused-imports");
const importPlugin = require('eslint-plugin-import');

const CONFIG1 = {
    files: ["**/*.ts"],
    // ignores: ["**/*.spec.ts"],
    settings: {
        "import/resolver": {
            typescript: {
                alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
                // Choose from one of the "project" configs below or omit to use <root>/tsconfig.json by default
            },
        },
    },
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommended,
        ...tseslint.configs.stylistic,
        ...angular.configs.tsRecommended,
        {
            ...importPlugin.flatConfigs?.recommended,
            ...importPlugin.flatConfigs?.errors,
            ...importPlugin.flatConfigs?.warnings,
        },
        {
            ...importPlugin.flatConfigs?.typescript,
        },
    ],
    processor: angular.processInlineTemplates,
    plugins: {
        // @ts-ignore
        "unused-imports": unusedImports,
    },
    rules: {
        "@angular-eslint/directive-selector": [
            "error",
            {
                type: "attribute",
                prefix: "app",
                style: "camelCase",
            },
        ],
        "@angular-eslint/component-selector": [
            "error",
            {
                type: "element",
                prefix: "app",
                style: "kebab-case",
            },
        ],
        "@angular-eslint/no-output-on-prefix": "warn",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                "vars": "all",
                "args": "after-used",
                "ignoreRestSiblings": false,
                "varsIgnorePattern": "^_",
                "argsIgnorePattern": "^_"
            }
        ],
        "import/no-useless-path-segments": 'warn',
        "import/no-relative-packages": 'error',
        "import/no-absolute-path": "error",
        "import/no-cycle": "error",
        "import/no-self-import": "error",
        "import/extensions": "error",
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "import/order": [
            "error",
            {
                "groups": [
                    ["builtin", "external"],
                    ["internal", "parent", "sibling"],
                    "index",
                ],
                "newlines-between": "always",
            }
        ],
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
            "warn",
            {
                "vars": "all",
                "args": "after-used",
                "ignoreRestSiblings": false,
                "varsIgnorePattern": "^_",
                "argsIgnorePattern": "^_"
            }
        ],
    },
};
const CONFIG2 = {
    files: ["**/*.html"],
    extends: [
        ...angular.configs.templateRecommended,
        ...angular.configs.templateAccessibility,
    ],
    rules: {
        "@angular-eslint/template/no-autofocus": "warn",
    },
};

// console.log("Config1: ", CONFIG1);
// console.log("ConfigArray: ", configArray);
// @ts-ignore
const configArray = tseslint.config(CONFIG1, CONFIG2);
module.exports = configArray;
