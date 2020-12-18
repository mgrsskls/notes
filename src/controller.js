const Md = require("markdown-it");
const db = require("./db");

module.exports = {
  async index({ tags: activeTags = [], query, edit }) {
    return new Promise((resolve) => {
      db.query(
        `
          SELECT * FROM notes ${
            query
              ? `WHERE title ILIKE '%${query}%' OR url ILIKE '%${query}%' OR text ILIKE '%${query}%'`
              : ""
          } ORDER BY created_at DESC;
          SELECT * FROM tags;
          `,
        [],
        (error, [notesResult, tagsResult]) => {
          if (error) throw error;

          const allTags = tagsResult.rows;

          let notes = notesResult.rows.map(({ id, title, url, text }) => {
            return {
              id,
              title,
              url,
              text,
              tags: allTags
                .filter(({ note_id: nodeId }) => nodeId === id)
                .map(({ tag }) => tag)
                .sort(),
            };
          });

          if (activeTags.length > 0) {
            notes = notes.filter((note) =>
              activeTags.every((tag) => note.tags.includes(tag))
            );
          }

          resolve({
            notes: notes.map(({ id, title, url, text, tags }) => ({
              id,
              title,
              url,
              text: convertMarkdownToHtml(text),
              tags,
            })),
            tags: [...new Set(allTags.map((tag) => tag.tag))],
            activeTags,
            query,
            note: edit
              ? notes.find((note) => note.id === parseInt(edit, 10))
              : null,
          });
        }
      );
    });
  },

  async create({ title, url, text, tags }) {
    return new Promise((resolve) => {
      db.query(
        `
          INSERT INTO notes (title, url, text) VALUES (${
            title === "" ? null : `'${title}'`
          }, ${url === "" ? null : `'${url}'`}, ${
          text === "" ? null : `'${text}'`
        }) RETURNING id;
        ${
          tags && tags.length > 0
            ? `INSERT INTO tags(note_id, tag) VALUES ${tags
                .map((tag) => `(lastval(), '${tag}')`)
                .join(",")};`
            : ""
        }
      `,
        [],
        (error) => {
          if (error) {
            resolve({
              error: error.toString(),
              note: { title, url, text, tags },
            });
          }

          resolve();
        }
      );
    });
  },

  async destroy({ id }) {
    return new Promise((resolve) => {
      db.query(
        `
        DELETE FROM tags WHERE note_id = ${id};
        DELETE FROM notes WHERE id = ${id};
      `,
        [],
        (error) => {
          if (error) throw error;

          resolve();
        }
      );
    });
  },

  async update({ id, title, url, text, tags }) {
    return new Promise((resolve) => {
      db.query(
        `
      UPDATE notes
      SET title = ${title === "" ? null : `'${title}'`},
          url = ${url === "" ? null : `'${url}'`},
          text = ${text === "" ? null : `'${text}'`}
      WHERE id = ${id};
      DELETE FROM tags
      WHERE note_id = ${id};
      ${
        tags && tags.length > 0
          ? `INSERT INTO tags(note_id, tag) VALUES ${tags
              .map((tag) => `(${id}, '${tag}')`)
              .join(",")};`
          : ""
      }`,
        [],
        (error) => {
          if (error) {
            resolve({
              error: error.toString(),
              note: { title, url, text, tags },
            });
          }

          resolve();
        }
      );
    });
  },
};

/**
 * @param {string} markdown
 * @returns {string}
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return null;

  const md = new Md();

  return md.render(markdown);
}
