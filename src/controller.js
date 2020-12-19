const Md = require("markdown-it");
const db = require("./db");

module.exports = {
  async index({ tags: activeTags = [], query, edit }) {
    return new Promise((resolveIndex) => {
      Promise.all([
        new Promise((resolve) => {
          db.getNotes(query, (error, res) => {
            resolve(res);
          });
        }),
        new Promise((resolve) => {
          db.getTags((error, res) => {
            resolve(res);
          });
        }),
      ]).then((res) => {
        const allTags = res[1].rows;
        let notes = res[0].rows.map(({ id, title, url, text }) => {
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

        resolveIndex({
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
      });
    });
  },

  async create({ title, url, text, tags }) {
    let result;

    try {
      result = await db.createNote(title, url, text);
    } catch (error) {
      return {
        error: error.toString(),
        note: { title, url, text, tags },
      };
    }

    if (
      result &&
      result.rows &&
      result.rows[0] &&
      result.rows[0].id &&
      tags &&
      tags.length > 0
    ) {
      try {
        return await db.createTags(result.rows[0].id, tags);
      } catch (error) {
        return {
          error: error.toString(),
          note: { title, url, text, tags },
        };
      }
    } else {
      return true;
    }
  },

  async destroy({ id }) {
    return new Promise((resolve) => {
      Promise.all([
        new Promise((res) => {
          db.deleteTags(id, (error) => {
            if (error) throw error;
            res();
          });
        }),
        new Promise((res) => {
          db.deleteNote(id, (error) => {
            if (error) throw error;
            res();
          });
        }),
      ]).then(resolve);
    });
  },

  async update({ id, title, url, text, tags }) {
    return new Promise((resolve) => {
      const promises = [
        new Promise((res) => {
          db.updateNote({ title, url, text, id }, (error) => {
            if (error) {
              res({
                error: error.toString(),
                note: { title, url, text, tags },
              });
            } else {
              res();
            }
          });
        }),
        new Promise((res) => {
          db.deleteTags(id, async (error) => {
            if (error) {
              res({
                error: error.toString(),
                note: { title, url, text, tags },
              });
            } else if (tags && tags.length > 0) {
              const params = [];

              tags.forEach((tag) => {
                params.push(id);
                params.push(tag);
              });

              try {
                await db.createTags(id, tags);
                res();
              } catch (err) {
                res({
                  error: err.toString(),
                  note: { title, url, text, tags },
                });
              }
            } else {
              res();
            }
          });
        }),
      ];

      Promise.all(promises).then(resolve);
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
