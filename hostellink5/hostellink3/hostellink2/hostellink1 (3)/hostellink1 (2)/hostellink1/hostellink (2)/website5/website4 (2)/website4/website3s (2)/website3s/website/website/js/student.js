import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Student dashboard loaded");

  /* ======================
     MENU TOGGLE
  ====================== */
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const menuBackdrop = document.getElementById("menuBackdrop");
  const logoutBtn = document.getElementById("logoutBtn");

  if (menuToggle && sidebar && menuBackdrop) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      menuBackdrop.classList.toggle("open");
    });

    menuBackdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      menuBackdrop.classList.remove("open");
    });

    sidebar.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        sidebar.classList.remove("open");
        menuBackdrop.classList.remove("open");
      });
    });
  }

  /* ======================
     LOGOUT
  ====================== */
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  /* ======================
     AUTH CHECK
  ====================== */
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    window.location.href = "login.html";
    return;
  }

  /* ======================
     LOAD REAL RECENT ISSUES
  ====================== */
  loadRecentIssues();
});

/* ======================
   FETCH & RENDER RECENT ISSUES
====================== */
async function loadRecentIssues() {
  const { data, error } = await supabase
    .from("issues")
    .select("category, status,hostel, block, room")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(2);

  if (error) {
    console.error("Failed to load recent issues", error);
    return;
  }

  const container = document.getElementById("recentIssuesContainer");
  if (!container) return;

  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No recent issues reported.</p>";
    return;
  }

  data.forEach(issue => {
    const div = document.createElement("div");
    div.className = "issue-card";

    div.innerHTML = `
      <strong>${issue.category}</strong>
      <span class="badge ${issue.status}">${issue.status}</span>
      <p>${issue.block} • ${issue.room}</p>
    `;

    container.appendChild(div);
  });
}

