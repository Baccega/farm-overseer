import { defineConfig, lazyPlugins } from "vite-plus";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: lazyPlugins(() => [tailwindcss()]),
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
