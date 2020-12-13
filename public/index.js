document.addEventListener("DOMContentLoaded", () => {
  const tags = [];

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
});
