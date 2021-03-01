const locales = {
  en: {
    login: {
      login: "Login",
      password: "Password",
    },
    index: {
      filter: "Filter",
      add: "Add",
    },
    note: {
      toggle: "Add note",
      label: "note",
      attributes: {
        title: "Title",
        url: "URL",
        text: "Text",
        tags: "Tags",
        topic: "Topic",
      },
      validation: {
        title: "Title needs to be filled out",
      },
      create: {
        submit: "Create",
      },
      delete: {
        confirm: "Do you really want to delete this note?",
        submit: "Delete",
      },
      show: {
        link: "View",
      },
      update: {
        link: "Edit",
        submit: "Update",
      },
      copy: {
        label: "Copy",
        feedback: "Copied!",
      },
      createdAt: "Created at",
    },
    search: {
      label: "Search",
      submit: "Submit",
    },
    tags: {
      label: "Tags",
    },
    topics: {
      label: "Topics",
    },
  },
};

module.exports = (lang) => locales[lang];
