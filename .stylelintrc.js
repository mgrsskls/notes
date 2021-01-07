const deepMerge = require("deepmerge");
const stylelintConfig = require("@factorial/stack-css").stylelint;

module.exports = deepMerge(stylelintConfig, {
  rules: {
    "value-no-vendor-prefix": [true, { ignoreValues: ["fill-available"] }],
  },
});
