module.exports = {
  use: [
    require("@factorial/stack-javascript"),
    require("@factorial/stack-css"),
  ],
  distFolder: "public/assets",
  cssFiles: [
    "views/html.css",
    "views/index/index.css",
    "views/login/login.css",
  ],
  rootFolder: "/",
};
