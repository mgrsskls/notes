module.exports = {
  use: [
    require("@factorial/stack-javascript"),
    require("@factorial/stack-css"),
  ],
  distFolder: "public/assets",
  cssFiles: ["assets/common.css", "assets/index.css", "assets/login.css"],
  rootFolder: "/",
};
