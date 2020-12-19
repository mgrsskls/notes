const { Client } = require("pg");

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect();

module.exports = {
  getNotes: (query, cb) => {
    client.query(
      query
        ? `
        SELECT * FROM notes WHERE title ILIKE $1 OR url ILIKE $1 OR text ILIKE $1 ORDER BY created_at DESC;
        `
        : `
        SELECT * FROM notes ORDER BY created_at DESC;
      `,
      query ? [`%${query}%`] : [],
      (error, response) => {
        cb(error, response);
      }
    );
  },

  getTags: (cb) => {
    client.query("SELECT * FROM tags ORDER BY tag", [], (error, response) => {
      cb(error, response);
    });
  },

  createNote: (title, url, text) => {
    return client.query(
      "INSERT INTO notes (title, url, text) VALUES ($1, $2, $3) RETURNING id;",
      [
        title === "" ? null : title,
        url === "" ? null : url,
        text === "" ? null : text,
      ]
    );
  },

  createTags: async (noteId, tags) => {
    const params = [];

    tags.forEach((tag) => {
      params.push(noteId);
      params.push(tag);
    });

    return client.query(
      `INSERT INTO tags(note_id, tag) VALUES ${expand(tags.length, 2)};`,
      params
    );
  },

  deleteTags: (noteId, cb) => {
    client.query(
      "DELETE FROM tags WHERE note_id = $1;",
      [noteId],
      (error, result) => {
        cb(error, result);
      }
    );
  },

  deleteNote: (id, cb) => {
    client.query("DELETE FROM notes WHERE id = $1;", [id], (error, result) => {
      cb(error, result);
    });
  },

  updateNote: ({ title, url, text, id }, cb) => {
    client.query(
      "UPDATE notes SET title = $1, url = $2, text = $3 WHERE id = $4;",
      [title, url, text, id],
      (error, result) => {
        cb(error, result);
      }
    );
  },
};

/**
 * @param {number} rowCount
 * @param {number} columnCount
 * @param {number} [startAt]
 * @returns {Array}
 */
function expand(rowCount, columnCount, startAt = 1) {
  let index = startAt;

  return Array(rowCount)
    .fill(0)
    .map(
      () =>
        `(${Array(columnCount)
          .fill(0)
          .map(() => `$${index++}`)
          .join(", ")})`
    )
    .join(", ");
}
