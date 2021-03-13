const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect((err) => {
  if (err) {
    console.error("connection error", err.stack);
  } else {
    console.log("connected");
  }
});

module.exports = {
  getNotes: (query, cb) => {
    client.query(
      query
        ? `
        SELECT * FROM notes WHERE title ILIKE $1 OR url ILIKE $1 OR text ILIKE $1 ORDER BY id DESC;
        `
        : `
        SELECT * FROM notes ORDER BY id DESC;
      `,
      query ? [`%${query}%`] : [],
      (error, response) => {
        cb(error, response);
      }
    );
  },

  getNoteByPublicId: (publicId, cb) => {
    client.query(
      "SELECT * FROM notes WHERE public_id=$1",
      [publicId],
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

  createNote: (title, url, text, topic, publicId, isPublic) => {
    return client.query(
      "INSERT INTO notes (title, url, text, topic, public_id, is_public) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, url, text, topic, public_id, is_public;",
      [
        title === "" ? null : title,
        url === "" ? null : url,
        text === "" ? null : text,
        topic === "" ? null : topic,
        publicId,
        isPublic,
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

  updateNote: ({ title, url, text, id, isPublic }, cb) => {
    client.query(
      "UPDATE notes SET title = $1, url = $2, text = $3, is_public = $4 WHERE id = $5;",
      [title, url, text, isPublic, id],
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
