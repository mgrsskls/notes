const twig = require("twig");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const compression = require("compression");
const dotProp = require("dot-prop");
const RateLimit = require("express-rate-limit");

const limiter = new RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  skip: (req) => {
    return path.extname(req.url).length > 0;
  },
});
const loginLimiter = new RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});

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
app.use(csrf({ cookie: true }));
app.use(compression());
app.set("trust proxy", true);
app.use("/", limiter);
app.use("/login", loginLimiter);
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

app.listen(PORT, () =>
  console.log(`Server started at http://localhost:${PORT}`)
);

Router(app);
