const rootDir = process.cwd().includes("packages/boono-sql")
  ? "./"
  : "./packages/boono-sql";

module.exports = {
  extends: ["../../node_modules/@kikko-land/common-scripts/eslintrc.cjs"],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
    tsconfigRootDir: rootDir,
    project: "./tsconfig.json",
  },
};
