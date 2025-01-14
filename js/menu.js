function isMenuVisible() {
  const menu = document.getElementById("menu");
  return !menu.classList.contains("hidden");
}

function toggleMenu() {
  const menu = document.getElementById("menu");
  if (menu.classList.contains("hidden")) {
    showMenu();
  } else {
    hideMenu();
  }
  setTimeout(function () {
    map.invalidateSize();
  }, 300); // Time for animation
}

// Ensure the options menu is hidden
function hideMenu() {
  const menu = document.getElementById("menu");
  const button = document.getElementById("toggle-menu");
  if (!menu.classList.contains("hidden")) {
    menu.classList.add("hidden");
  }
  button.textContent = "Optionen anzeigen";
}

function showMenu() {
  const sidebar = document.getElementById("menu");
  const button = document.getElementById("toggle-menu");
  if (sidebar.classList.contains("hidden")) {
    sidebar.classList.remove("hidden");
    if (isMobile()) {
      hideSidebar();
    }
  }
  button.textContent = "Optionen verbergen";
}
