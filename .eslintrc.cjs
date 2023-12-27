module.exports = {
  overrides: [
    {
      files: ["*.js", "*.jsx", "*.ts", "*.tsx"],
      extends: "standard-with-typescript",
    },
  ],
  rules: {
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: false,
      },
    ],
  },
};
