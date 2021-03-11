const deepMerge = require("deepmerge");
const csrf = require("csurf");

const { verify, login, checkPassword } = require("./auth");
const {
  index,
  show,
  edit,
  create,
  update,
  destroy,
  public,
} = require("./controller");
const db = require("./db");

const csrfProtection = csrf({ cookie: true });

module.exports = function Router(app) {
  app.get("/", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        login(res);

        res.render(
          "index/index",
          deepMerge(await index(req.query), { csrfToken: req.csrfToken() })
        );
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.get("/notes/new", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        login(res);

        res.render(
          "new/new",
          deepMerge(await index(req.query), { csrfToken: req.csrfToken() })
        );
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.post("/notes/new", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        const data = await create(req.body);

        if (data.error) {
          res.render(
            "new/new",
            deepMerge(data, { csrfToken: req.csrfToken() })
          );
        } else {
          res.redirect(`/notes/${data.id}`);
        }
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.get("/notes/:id", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        login(res);

        res.render(
          "show/show",
          deepMerge(
            await show(req.params.id, req.query, req.protocol, req.get("host")),
            {
              csrfToken: req.csrfToken(),
            }
          )
        );
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.get("/notes/:id/edit", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        login(res);

        res.render(
          "edit/edit",
          deepMerge(await edit(req.params.id, req.query), {
            csrfToken: req.csrfToken(),
          })
        );
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.post("/notes/:id/edit", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        const { id } = req.params;
        await update(id, req.body);

        res.redirect(`/notes/${id}`);
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.post("/notes/:id/delete", csrfProtection, (req, res) => {
    verify(req)
      .then(async () => {
        await destroy(req.params.id);

        res.redirect("/");
      })
      .catch(() => {
        res.redirect("/login");
      });
  });

  app.get("/public/:id", async (req, res) => {
    res.render("public/public", await public(req.params.id));
  });

  app.get("/login", csrfProtection, (req, res) => {
    verify(req)
      .then(() => res.redirect("/"))
      .catch(() => res.render("login/login", { csrfToken: req.csrfToken() }));
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
