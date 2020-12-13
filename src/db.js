const { Client } = require("pg");

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect();

module.exports = {
  query: (text, params, callback) => {
    return client.query(text, params, callback);
  },
};
