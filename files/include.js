// ============ SHARED HEADER / FOOTER LOADER ============
// This runs on every page. It fetches header.html and footer.html and
// injects them into the placeholder divs (#site-header / #site-footer),
// then marks the correct nav link "active" and re-wires the dropdown
// menus (since they didn't exist in the DOM yet when script.js first ran).

async function loadPartial(url, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    target.innerHTML = await response.text();
  } catch (err) {
    console.error(`Could not load ${url}:`, err);
  }
}

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(link => {
    if (link.getAttribute("data-nav") === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPartial("header.html", "site-header");
  await loadPartial("footer.html", "site-footer");

  setActiveNavLink();
  setupMobileMenu();

  // script.js already ran setupNavDropdowns() before the header existed,
  // so we call it again now that the real nav is in the DOM.
  if (typeof setupNavDropdowns === "function") {
    setupNavDropdowns();
  }
});

function setupMobileMenu() {
  const navToggle = document.querySelector(".nav-toggle");
  const navbar = document.querySelector(".navbar");
  if (!navToggle || !navbar) return;

  const navIcon = navToggle.querySelector("i");
  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = navbar.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (navIcon) {
      navIcon.classList.toggle("fa-bars", !open);
      navIcon.classList.toggle("fa-xmark", open);
      navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    }
  });

  document.addEventListener("click", (event) => {
    if (!navbar.contains(event.target) && navbar.classList.contains("nav-open")) {
      navbar.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}
