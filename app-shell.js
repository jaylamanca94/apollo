// Acadia owns navigation/menu anatomy and native details interaction.
// Apollo supplies route-group behaviour and dismissal, shared by all pages.
(() => {
  const groups = [...document.querySelectorAll(".apollo-nav-more")];
  function close(group, restoreFocus = false) {
    if (!group.open) return;
    group.open = false;
    group.querySelector("summary").setAttribute("aria-expanded", "false");
    if (restoreFocus) group.querySelector("summary").focus();
  }
  groups.forEach((group) => {
    const trigger = group.querySelector("summary");
    const links = [...group.querySelectorAll("a")];
    trigger.setAttribute("aria-expanded", String(group.open));
    group.addEventListener("toggle", () => {
      trigger.setAttribute("aria-expanded", String(group.open));
      if (group.open) groups.filter((other) => other !== group).forEach((other) => close(other));
    });
    trigger.addEventListener("keydown", (event) => {
      if (!["Enter", " ", "ArrowDown"].includes(event.key)) return;
      event.preventDefault();
      group.open = !group.open || event.key === "ArrowDown";
      trigger.setAttribute("aria-expanded", String(group.open));
      if (group.open) links[0]?.focus();
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(group, true);
      }
    });
    links.forEach((link) => {
      link.addEventListener("click", () => close(group));
      link.addEventListener("keydown", (event) => {
        if (event.key === " ") {
          event.preventDefault();
          link.click();
        }
      });
    });
  });
  document.addEventListener("click", (event) => groups.forEach((group) => {
    if (!group.contains(event.target)) close(group);
  }));
  window.addEventListener("scroll", () => groups.forEach((group) => close(group)), { passive: true });
  window.addEventListener("resize", () => groups.forEach((group) => close(group)));
})();
