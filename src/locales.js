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
      update: {
        link: "Edit",
        submit: "Update",
        cancel: "Cancel",
      },
      copy: {
        label: "Copy",
        feedback: "Copied!",
      },
    },
    search: {
      label: "Search",
      submit: "Submit",
    },
    tags: {
      label: "Tags",
    },
  },
};

module.exports = (lang) => locales[lang];
