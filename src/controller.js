const Md = require("markdown-it");
const db = require("./db");

const md = new Md();

const cache = {
  notes: {},
  tags: [],
};

module.exports = {
  async index({ tags: activeTags = [], query }) {
    return getNotesAndTags({ activeTags, query }, true);
  },

  async show(id, { tags: activeTags = [], query }) {
    const notesAndTags = await getNotesAndTags({ activeTags, query }, true);
    const note = notesAndTags.notes.find(
      (result) => result.id === parseInt(id, 10)
    );

    return {
      ...notesAndTags,
      note: {
        id: parseInt(note.id, 10),
        title: note.title,
        url: note.url,
        text: note.text,
        tags: note.tags,
        createdAt: note.created_at,
      },
    };
  },

  async edit(id, { tags: activeTags = [], query }) {
    const notesAndTags = await getNotesAndTags({ activeTags, query }, false);

    return {
      ...notesAndTags,
      note: notesAndTags.notes.find((note) => note.id === parseInt(id, 10)),
    };
  },

  async create({ title, url, text, tags }) {
    let result;

    try {
      result = await db.createNote(title, url, text);
      const [note] = result.rows;
      cache.notes[note.id] = {
        id: parseInt(note.id, 10),
        title: note.title,
        url: note.url,
        text: note.text,
        tags,
        created_at: note.created_at,
      };
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

        tags.forEach((tag) => {
          cache.tags.push({
            note_id: result.rows[0].id,
            tag,
          });
        });

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
    const parsedId = parseInt(id, 10);

    return new Promise((resolve) => {
      Promise.all([
        new Promise((res) => {
          db.deleteTags(id, (error) => {
            if (error) throw error;
            delete cache.notes[parsedId];
            res();
          });
        }),
        new Promise((res) => {
          db.deleteNote(id, (error) => {
            if (error) throw error;
            cache.tags = cache.tags.filter((tag) => tag.note_id !== parsedId);
            res();
          });
        }),
      ]).then(() => {
        resolve();
      });
    });
  },

  async update(id, { title, url, text, tags }) {
    const parsedId = parseInt(id, 10);

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
              cache.notes[id] = {
                id: parsedId,
                title,
                url,
                text,
                tags,
              };
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
            } else {
              cache.tags = cache.tags.filter((tag) => tag.note_id !== parsedId);
              cache.notes[id].tags = [];

              if (tags && tags.length > 0) {
                const params = [];

                tags.forEach((tag) => {
                  params.push(id);
                  params.push(tag);
                });

                try {
                  await db.createTags(id, tags);
                  cache.tags = [
                    ...cache.tags,
                    ...tags.map((tag) => ({ tag, note_id: parsedId })),
                  ];
                  cache.notes[id].tags = tags.map((tag) => ({
                    tag,
                    note_id: parsedId,
                  }));

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
            }
          });
        }),
      ];

      Promise.all(promises).then(() => {
        resolve();
      });
    });
  },
};

/**
 * @param {object} obj
 * @param {Array} obj.activeTags
 * @param {string} obj.query
 * @param {boolean} convertMarkdown
 * @returns {Promise}
 */
function getNotesAndTags({ activeTags, query }, convertMarkdown) {
  return new Promise((resolveIndex) => {
    Promise.all([
      new Promise((resolve) => {
        if (Object.keys(cache.notes).length > 1 && !query) {
          resolve(cache.notes);
        } else {
          db.getNotes(query, (error, { rows }) => {
            cache.notes = {};
            rows.forEach((note) => {
              cache.notes[note.id] = note;
            });
            resolve(cache.notes);
          });
        }
      }),
      new Promise((resolve) => {
        if (cache.tags.length > 0) {
          resolve(cache.tags);
        } else {
          db.getTags((error, { rows }) => {
            cache.tags = rows;
            resolve(rows);
          });
        }
      }),
    ]).then(([allNotes, allTags]) => {
      let notes = Object.values(allNotes).map(
        ({ id, title, url, text, created_at: createdAt }) => {
          return {
            id,
            title,
            url,
            text: convertMarkdown ? convertMarkdownToHtml(text) : text,
            tags: allTags
              .filter(({ note_id: nodeId }) => nodeId === id)
              .map(({ tag }) => tag)
              .sort((a, b) => a - b),
            created_at: createdAt,
          };
        }
      );

      if (activeTags.length > 0) {
        notes = notes.filter((note) =>
          activeTags.every((tag) => note.tags.includes(tag))
        );
      }

      resolveIndex({
        notes: notes.sort((a, b) => b.id - a.id),
        tags: [...new Set(allTags.map((tag) => tag.tag))],
        activeTags,
        query,
      });
    });
  });
}

/**
 * @param {string} markdown
 * @returns {string}
 */
function convertMarkdownToHtml(markdown) {
  if (!markdown) return null;

  return md.render(markdown);
}
