const deepMerge = require("deepmerge");
const Md = require("markdown-it");
const db = require("./db");

const md = new Md({ breaks: true, linkify: true });

const cache = {
  notes: {},
  tags: [],
  topics: [],
};
let allNotesInCache = false;

module.exports = {
  async index({ tags: activeTags = [], query, topic }) {
    return getNotesAndTags({ activeTags, query, topic }, true);
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
        topic: note.topic,
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

  async create({ title, url, text, tags, topic }) {
    let result;

    try {
      result = await db.createNote(title, url, text, topic);
      const [note] = result.rows;
      cache.notes[note.id] = {
        id: parseInt(note.id, 10),
        title: note.title,
        url: note.url,
        text: note.text,
        tags,
        created_at: note.created_at,
        topic: note.topic,
      };
    } catch (error) {
      return {
        error: error.toString(),
        note: { title, url, text, tags, topic },
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

  async update(id, { title, url, text, tags, topic }) {
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
              cache.notes[id] = deepMerge(cache.notes[id], {
                id: parsedId,
                title,
                url,
                text,
                tags,
                topic,
              });
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
 * @param {object} params
 * @param {Array} obj.activeTags
 * @param {string} obj.query
 * @param {string} obj.topic
 * @param {boolean} convertMarkdown
 * @returns {Promise}
 */
function getNotesAndTags(params, convertMarkdown) {
  return new Promise((resolveIndex) => {
    Promise.all([
      new Promise((resolve) => {
        if (allNotesInCache && !params.query) {
          resolve(cache.notes);
        } else {
          db.getNotes(params.query, (error, { rows }) => {
            cache.notes = {};
            rows.forEach((note) => {
              cache.notes[note.id] = note;
            });
            allNotesInCache = !params.query;
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
      const notes = Object.values(allNotes).map(
        ({ id, title, url, text, topic, created_at: createdAt }) => {
          return {
            id,
            title,
            url,
            text: convertMarkdown ? convertMarkdownToHtml(text) : text,
            tags: allTags
              .filter(({ note_id: nodeId }) => nodeId === id)
              .map(({ tag }) => tag)
              .sort((a, b) => a - b),
            topic,
            created_at: createdAt,
          };
        }
      );
      const topics = [...new Set(notes.map((note) => note.topic))];
      let filteredNotes = notes;

      if (params.topic) {
        filteredNotes = filteredNotes.filter(
          (note) => note.topic === params.topic
        );
      }

      if (params?.activeTags.length > 0) {
        filteredNotes = filteredNotes.filter((note) =>
          params.activeTags.every((tag) => note.tags.includes(tag))
        );
      }

      resolveIndex({
        notes: filteredNotes.sort((a, b) => b.id - a.id),
        tags: [...new Set(allTags.map((tag) => tag.tag))]
          .map((tag) => {
            const notesWithTag = notes.filter(({ tags }) => tags.includes(tag));
            const filteredNotesWithTag = filteredNotes.filter(({ tags }) =>
              tags.includes(tag)
            );
            return {
              tag,
              active: filteredNotesWithTag.length > 0,
              amount: notesWithTag.length,
            };
          })
          .sort((a, b) => {
            if (a.tag < b.tag) return -1;
            if (a.tag > b.tag) return 1;
            return 0;
          }),
        activeTags: params.activeTags,
        query: params.query,
        topics: topics.map((topic) => {
          return {
            topic,
            current: params.topic === topic,
            amount: notes.filter((note) => note.topic === topic).length,
          };
        }),
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
