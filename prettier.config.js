module.exports = {
  tabWidth: 2,
  singleQuote: false,
  bracketSameLine: false,
  trailingComma: "es5",
  semi: true,

  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  tailwindAttributes: ["className"],
};
