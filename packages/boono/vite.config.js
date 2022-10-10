const { defineConfig } = require("vitest/config");
const { buildConfig } = require("@kikko-land/common-scripts/vite.cjs");

const defaultConfig = buildConfig();
module.exports = defineConfig({
  ...defaultConfig,
  define: {
    ...defaultConfig.define,
    "import.meta.vitest": "undefined",
  },
  test: {
    ...defaultConfig.test,
    includeSource: ["src/**/*.{js,ts}"],
  },
});
