const Md = require("markdown-it");
const db = require("./db");

module.exports = {
  async index({ tags: activeTags = [], query }) {
    return getNotesAndTags({ activeTags, query });
  },

  show(id, { tags: activeTags = [], query }) {
    return Promise.all([
      getNotesAndTags({ activeTags, query }),
      getNote(id, true),
    ]).then((res) => {
      return { ...res[0], ...{ note: res[1] } };
    });
  },

  edit(id, { tags: activeTags = [], query }) {
    return Promise.all([
      getNotesAndTags({ activeTags, query }),
      getNote(id, false),
    ]).then((res) => {
      return { ...res[0], ...{ note: res[1] } };
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
        await db.createTags(result.rows[0].id, tags);
        return { id: result.rows[0].id };
      } catch (error) {
        return {
          error: error.toString(),
          note: { title, url, text, tags },
        };
      }
    } else {
      return { id: result.rows[0].id };
    }
  },

  async destroy(id) {
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

  async update(id, { title, url, text, tags }) {
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
 * @param {object} obj
 * @param {Array} obj.activeTags
 * @param {string} obj.query
 * @returns {Promise}
 */
function getNotesAndTags({ activeTags, query }) {
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
      });
    });
  });
}

/**
 * @param {number} id
 * @param {boolean} convertMarkdown
 * @returns {Promise}
 */
function getNote(id, convertMarkdown) {
  return new Promise((resolve) => {
    db.getNote(id, (error, res) => {
      const note = res.rows[0];

      resolve(
        convertMarkdown
          ? {
              id: note.id,
              title: note.title,
              url: note.url,
              text: convertMarkdownToHtml(note.text),
              tags: note.tags,
            }
          : note
      );
    });
  });
}

/**
 * @param {string} markdown
 * @returns {string}
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return null;

  const md = new Md();

  return md.render(markdown);
}
