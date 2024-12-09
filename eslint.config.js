// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const unusedImports = require("eslint-plugin-unused-imports");

console.log(unusedImports)

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      // @ts-ignore
      "unused-imports": unusedImports
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          // plugins: {
          //   "unused-imports": unusedImports,
          // },
        },
      ],
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
      // "@typescript-eslint/no-unused-vars": [
      //   "error",
      //   {
      //     "vars": "all",
      //     "args": "after-used",
      //     "ignoreRestSiblings": false,
      //     "no-unused-vars": "off",
      //     "unused-imports/no-unused-imports": "error",
      //     "unused-imports/no-unused-vars": [
      //       "warn",
      //       {
      //         "vars": "all",
      //         "varsIgnorePattern": "^_",
      //         "args": "after-used",
      //         "argsIgnorePattern": "^_"
      //       }
      //     ]
      //   }
      // ]
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  }
);
