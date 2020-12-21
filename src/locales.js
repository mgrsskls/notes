const locales = {
  en: {
    login: {
      login: "Login",
      password: "Password",
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
    },
    search: {
      label: "Search",
      submit: "Submit",
    },
    filter: {
      label: "Filter",
    },
  },
};

module.exports = (lang) => locales[lang];
