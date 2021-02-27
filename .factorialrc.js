module.exports = {
  use: [
    require("@factorial/stack-javascript"),
    require("@factorial/stack-css"),
  ],
  rootFolder: "views",
  distFolder: "public/assets",
  cssFiles: ["html.css", "layout.css", "login/login.css", "index/index.css"],
};
