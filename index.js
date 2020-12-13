const twig = require("twig");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotProp = require("dot-prop");

const Router = require("./src/router");
const Locales = require("./src/locales");

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  twig.cache(false);
}

twig.extendFilter("t", (val) => {
  return dotProp.get(Locales("en"), val) || "LOCALE_MISSING";
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

app.listen(PORT, () =>
  console.log(`Server started at http://localhost:${PORT}`)
);

Router(app);
