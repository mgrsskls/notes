const jwt = require("jsonwebtoken");
const path = require("path");
const env = require("node-env-file");

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  env(path.join(process.cwd(), ".env")).ACCESS_TOKEN_SECRET;

module.exports = {
  /**
   * Checks if the user is logged in
   *
   * @param {object} req
   * @returns {Promise}
   */
  verify(req) {
    return new Promise((resolve, reject) => {
      const accessToken =
        req.cookies && req.cookies.jwt ? req.cookies.jwt : null;

      if (!accessToken) {
        reject();
      }

      try {
        jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        resolve();
      } catch (e) {
        reject();
      }
    });
  },

  /**
   * Creates an access token and sets a cookie with that token
   *
   * @param {object} res
   */
  login(res) {
    const accessToken = jwt.sign(
      {
        data: ACCESS_TOKEN_SECRET,
      },
      ACCESS_TOKEN_SECRET,
      {
        expiresIn: 60 * 60 * 24,
      }
    );

    res.cookie("jwt", accessToken, { secure: true, httpOnly: true });
  },

  /**
   * Checks if the given password equals the env var ACCESS_TOKEN_SECRET
   *
   * @param {string} password
   * @returns {boolean}
   */
  checkPassword(password) {
    return password === ACCESS_TOKEN_SECRET;
  },
};
