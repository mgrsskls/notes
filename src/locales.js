const locales = {
  en: {
    login: {
      login: "Login",
      password: "Password",
    },
    note: {
      attributes: {
        title: "Title",
        url: "URL",
        text: "Text",
        tags: "Tags",
      },
      create: {
        submit: "Save",
      },
      delete: {
        submit: "Delete",
      },
    },
    search: {
      label: "Search",
      submit: "Submit",
    },
    filter: {
      label: "Filtered by:",
    },
  },
};

module.exports = (lang) => locales[lang];
