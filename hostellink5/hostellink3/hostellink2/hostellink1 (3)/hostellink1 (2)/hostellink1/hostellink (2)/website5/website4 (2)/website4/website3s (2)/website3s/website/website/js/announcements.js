// Logout button functionality for announcements section
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  };
}
import { supabase } from "./supabase.js";

/* ======================
   AUTH CHECK
====================== */
const { data: auth } = await supabase.auth.getUser();
if (!auth.user) {
  window.location.href = "login.html";
}

/* ======================
   GET USER ROLE
====================== */
const { data: profile } = await supabase
  .from("users")
  .select("role, hostel")
  .eq("id", auth.user.id)
  .single();
console.log("ROLE FROM DB =", profile.role);


/* ======================
   ELEMENTS
====================== */
const addBox = document.getElementById("addAnnouncementBox");
const announcementsDiv = document.getElementById("announcements");
const postBtn = document.getElementById("postAnnouncement");

/* ======================
   SHOW ADMIN FORM
====================== */
if (profile.role === "management") {
  addBox.classList.remove("hidden");
} else {
  addBox.classList.add("hidden");
}

/* ======================
   FETCH ANNOUNCEMENTS
====================== */
async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

/* ======================
   RENDER ANNOUNCEMENTS
====================== */
async function renderAnnouncements() {
  announcementsDiv.innerHTML = "";

  const announcements = await fetchAnnouncements();

  if (announcements.length === 0) {
    announcementsDiv.innerHTML =
      "<p style='opacity:0.6'>No announcements yet</p>";
    return;
  }

  announcements.forEach(a => {
    const div = document.createElement("div");
    div.className = "glass-card announcement";

    div.innerHTML = `
      <h3>${a.title}</h3>
      <p style="opacity:0.7;font-size:14px">
        ${new Date(a.created_at).toDateString()}
      </p>
      <p>${a.content}</p>

      <div class="reactions" data-id="${a.id}">
        <span class="reaction" data-emoji="👍">👍</span>
        <span class="reaction" data-emoji="😢">😢</span>
        <span class="reaction" data-emoji="⚠️">⚠️</span>
        <span class="reaction" data-emoji="🎉">🎉</span>
      </div>
    `;


    announcementsDiv.appendChild(div);
  });
  await loadReactions();

}
/* ======================
   LOAD REACTIONS
====================== */
async function loadReactions() {
  const { data, error } = await supabase
    .from("announcement_reactions")
    .select("announcement_id, emoji");

  if (error) {
    console.error(error);
    return;
  }

  document.querySelectorAll(".reactions").forEach(container => {
    const id = container.dataset.id;

    const related = data.filter(
      r => r.announcement_id === id
    );

    container.querySelectorAll(".reaction").forEach(span => {
      const emoji = span.dataset.emoji;
      const count = related.filter(r => r.emoji === emoji).length;
      span.textContent = count ? `${emoji} ${count}` : emoji;
    });
  });
}
/* ======================
   HANDLE REACTION CLICK
====================== */
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("reaction")) return;

  const emoji = e.target.dataset.emoji;
  const announcementId =
    e.target.closest(".reactions").dataset.id;

  // check if user already reacted
  const { data: existing } = await supabase
    .from("announcement_reactions")
    .select("id")
    .eq("announcement_id", announcementId)
    .eq("user_id", auth.user.id)
    .eq("emoji", emoji)
    .single();

  if (existing) {
    // remove reaction (toggle off)
    await supabase
      .from("announcement_reactions")
      .delete()
      .eq("id", existing.id);
  } else {
    // add reaction
    await supabase
      .from("announcement_reactions")
      .insert({
        announcement_id: announcementId,
        user_id: auth.user.id,
        emoji
      });
  }

  loadReactions();
});




/* ======================
   POST ANNOUNCEMENT
====================== */
postBtn?.addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const role_target = document.getElementById("roleTarget").value;

  if (!title || !content) {
    alert("Fill all fields");
    return;
  }

  const { error } = await supabase.from("announcements").insert({
    title,
    content,
    role_target,
    hostel: profile.hostel ?? "ALL"
  });

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("content").value = "";

  // Redirect to management dashboard if the user is a manager
  

  renderAnnouncements();
});

/* ======================
   INITIAL LOAD
====================== */
renderAnnouncements();
