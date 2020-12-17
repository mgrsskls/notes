const Md = require("markdown-it");
const db = require("./db");

module.exports = {
  async index({ tags: activeTags = [], query }) {
    return new Promise((resolve) => {
      db.query(
        `
          SELECT * FROM public.notes ${
            query
              ? `WHERE title ILIKE '%${query}%' OR url ILIKE '%${query}%' OR text ILIKE '%${query}%'`
              : ""
          } ORDER BY created_at DESC;
          SELECT * FROM tags;
          `,
        [],
        (error, [notesResult, tagsResult]) => {
          if (error) throw error;

          const tags = tagsResult.rows;

          let notes = notesResult.rows.map(({ id, title, url, text }) => {
            return {
              id,
              title,
              url,
              text: convertMarkdownToHtml(text),
              tags: tags
                .filter(({ note_id: nodeId }) => nodeId === id)
                .map(({ tag }) => tag),
            };
          });

          if (activeTags.length > 0) {
            notes = notes.filter((note) =>
              activeTags.every((tag) => note.tags.includes(tag))
            );
          }

          resolve({
            notes,
            tags: [...new Set(tags.map((tag) => tag.tag))],
            activeTags,
            query,
          });
        }
      );
    });
  },

  async create({ title, url, text, tags }) {
    return new Promise((resolve) => {
      db.query(
        `
        BEGIN;
          INSERT INTO public.notes (title, url, text) VALUES (${
            title === "" ? null : `'${title}'`
          }, ${url === "" ? null : `'${url}'`}, ${
          text === "" ? null : `'${text}'`
        }) RETURNING id;
        ${
          tags && tags.length > 0
            ? `INSERT INTO public.tags(note_id, tag) VALUES ${tags
                .map((tag) => `(lastval(), '${tag}')`)
                .join(",")};`
            : ""
        }
        COMMIT;
      `,
        [],
        (error) => {
          if (error) throw error;

          resolve();
        }
      );
    });
  },

  async destroy({ id }) {
    return new Promise((resolve) => {
      db.query(
        `
        DELETE FROM public.tags WHERE note_id = ${id};
        DELETE FROM public.notes WHERE id = ${id};
      `,
        [],
        (error) => {
          if (error) throw error;

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
