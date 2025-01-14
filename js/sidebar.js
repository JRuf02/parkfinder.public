function isSidebarVisible() {
  const sidebar = document.getElementById("sidebar");
  return !sidebar.classList.contains("hidden");
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("hidden")) {
    showSidebar();
  } else {
    hideSidebar();
  }
  setTimeout(function () {
    map.invalidateSize();
  }, 300); // Time for animation
}

// Ensure the sidebar is hidden
function hideSidebar() {
  const sidebar = document.getElementById("sidebar");
  const button = document.getElementById("toggle-sidebar");
  if (!sidebar.classList.contains("hidden")) {
    sidebar.classList.add("hidden");
  }
  button.textContent = "Liste anzeigen";
}

function showSidebar() {
  const sidebar = document.getElementById("sidebar");
  const button = document.getElementById("toggle-sidebar");
  if (sidebar.classList.contains("hidden")) {
    sidebar.classList.remove("hidden");
    if (isMobile()) {
      hideMenu();
    }
  }
  button.textContent = "Liste verbergen";
}
