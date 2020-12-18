const { verify, login, checkPassword } = require("./auth");
const { index, create, update, destroy } = require("./controller");

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
        let data;

        if ("delete" in req.body) {
          data = await destroy(req.body);
        } else if ("update" in req.body) {
          data = await update(req.body);
        } else {
          data = await create(req.body);
        }

        data = { ...(await index(req.query)), ...data };

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
      res.redirect("/login");
    }
  });
};
