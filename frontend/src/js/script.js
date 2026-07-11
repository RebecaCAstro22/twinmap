const viewButtons = document.querySelectorAll("[data-view]");
const panels = document.querySelectorAll("[data-panel]");
const navLinks = document.querySelectorAll(".nav-link");
const appPanels = new Set(["inicio-app", "mapa", "bitacora", "guardados", "emergencia", "configuracion"]);

function showView(viewName) {
  const target = viewName === "landing" ? "landing" : viewName;

  document.body.classList.toggle("has-topbar", appPanels.has(target));

  panels.forEach((panel) => {
    panel.classList.toggle("is-visible", panel.dataset.panel === target);
  });

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === target);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

viewButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showView(button.dataset.view);
  });
});
