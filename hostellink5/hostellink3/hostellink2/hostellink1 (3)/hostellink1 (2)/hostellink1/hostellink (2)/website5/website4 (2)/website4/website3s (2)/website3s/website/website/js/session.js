import { supabase } from "./supabase.js";

supabase.auth.onAuthStateChange((event, session) => {
  if (!session && !location.pathname.endsWith("login.html")) {
    window.location.href = "login.html";
  }
});
/* ======================
   MENU TOGGLE FUNCTIONALITY
====================== */
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const menuBackdrop = document.getElementById("menuBackdrop");

  if (!menuToggle || !sidebar || !menuBackdrop) return;

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("active");
    menuBackdrop.classList.toggle("active");
  });

  menuBackdrop.addEventListener("click", () => {
    sidebar.classList.remove("active");
    menuBackdrop.classList.remove("active");
  });

  // Close menu when a link is clicked
  const sidebarLinks = sidebar.querySelectorAll("a");
  sidebarLinks.forEach(link => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("active");
      menuBackdrop.classList.remove("active");
    });
  });
});