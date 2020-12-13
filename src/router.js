const { verify, login, checkPassword } = require("./auth");
const { index, create, destroy } = require("./controller");

module.exports = function Router(app) {
  app.get("/", (req, res) => {
    verify(req)
      .then(async () => {
        const data = await index(req.query);

        res.render("index", data);
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.post("/", (req, res) => {
    verify(req)
      .then(async () => {
        if ("delete" in req.body) {
          await destroy(req.body);
        } else {
          await create(req.body);
        }

        const data = await index(req.query);

        res.render("index", data);
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.get("/login", (req, res) => {
    verify(req)
      .then(() => res.redirect("/"))
      .catch(() => res.render("login"));
  });

  app.post("/login", (req, res) => {
    if (checkPassword(req.body.password)) {
      login(res);
      res.redirect("/");
    } else {
      res.redirect(401, "/login");
    }
  });
};
