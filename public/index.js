document.addEventListener("DOMContentLoaded", () => {
  const tags = [];

  Array.from(document.querySelectorAll("pre code")).forEach((code) => {
    const template = document.getElementById("copy");
    const button = template.content.firstElementChild.cloneNode(true);

    button.addEventListener("click", (e) =>
      copy(e.target.closest("button"), code)
    );
    code.closest(".Note-text").appendChild(button);
  });

  Array.from(document.querySelectorAll(".Tabs-button")).forEach((button) => {
    button.addEventListener("click", (e) => {
      const el = e.target;
      const target = el.getAttribute("aria-controls");

      Array.from(document.querySelectorAll(".Tabs-tab")).forEach((tab) => {
        if (tab.id === target) {
          tab.hidden = false;
        } else {
          tab.hidden = true;
        }
      });

      Array.from(document.querySelectorAll(".Tabs-button")).forEach(
        (tabButton) => {
          if (el === tabButton) {
            tabButton.setAttribute("aria-expanded", "true");
          } else {
            tabButton.removeAttribute("aria-expanded");
          }
        }
      );
    });
  });

  if (document.querySelector(".Notes")) {
    const mq = window.matchMedia("(min-width: 64.0625em)");

    if (mq.matches && !window.CSS.supports("grid-template-rows", "masonry")) {
      const script = document.createElement("script");
      script.src = "/masonry.js";
      script.onload = function () {
        new Masonry(".Notes", {
          itemSelector: ".Notes-item",
          percentPosition: true,
          gutter: 30,
        });
      };
      document.head.appendChild(script);
    }
  }

  Array.from(document.querySelectorAll(".Add-tags button")).forEach((button) =>
    button.addEventListener(
      "click",
      (evt) => {
        evt.target.closest("li").remove();
      },
      { once: true }
    )
  );

  if (document.getElementById("tag")) {
    document.getElementById("tag").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.value.trim().length > 0) {
        e.preventDefault();

        const tag = e.target.value;

        if (!tags.includes(tag)) {
          const li = document
            .getElementById("tag-template")
            .content.cloneNode(true);
          const button = li.querySelector("button");

          li.querySelector("input").value = tag;
          button.textContent = tag;
          button.addEventListener(
            "click",
            (evt) => {
              evt.target.closest("li").remove();
            },
            { once: true }
          );

          document.querySelector(".Add-tags").appendChild(li);

          tags.push(tag);
        }

        e.target.value = "";
      }
    });
  }
});

function copy(button, el) {
  const textarea = document.createElement("textarea");
  textarea.value = el.textContent;
  textarea.classList.add("u-hiddenVisually");

  document.body.appendChild(textarea);

  textarea.select();
  textarea.setSelectionRange(0, 99999); /* For mobile devices */

  document.execCommand("copy");

  textarea.remove();

  button.addEventListener("animationend", (e) =>
    e.target.classList.remove("is-copied")
  );

  button.classList.add("is-copied");
}
