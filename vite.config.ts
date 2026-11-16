import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
});
