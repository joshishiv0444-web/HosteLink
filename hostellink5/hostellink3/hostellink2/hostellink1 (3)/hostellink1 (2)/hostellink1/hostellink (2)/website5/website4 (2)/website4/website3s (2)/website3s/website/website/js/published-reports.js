import { supabase } from "./supabase.js";

/* ======================
   LOGOUT
====================== */
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  };
}

/* ======================
   LOAD PUBLISHED REPORTS
====================== */
const container = document.getElementById("reportsContainer");

async function loadReports() {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      id,
      category,
      priority,
      description,
      visibility,
      image_url,
      created_at
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load reports</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No reports found</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach(issue => {
    const card = document.createElement("div");
    card.className = "issue-card";
    card.dataset.id = issue.id;

    card.innerHTML = `
      <div class="issue-card-content">
        <div class="issue-card-left">
          <h3>${issue.category}</h3>
          <p><strong>Priority:</strong> ${issue.priority}</p>
          <p>${issue.description}</p>
        </div>

        <div class="issue-card-right">
          ${issue.image_url ? `<img src="${issue.image_url}" class="issue-img">` : ""}
        </div>
      </div>

      <!-- COMMENTS -->
      <div class="comments-section">
        <div class="comments-list" id="comments-${issue.id}"></div>

        <input
          type="text"
          class="comment-input"
          data-id="${issue.id}"
          placeholder="Add a comment..."
        />

        <button class="comment-btn" data-id="${issue.id}">
          Comment
        </button>
      </div>
    `;

    container.appendChild(card);

    loadIssueComments(issue.id);
  });

  attachCommentHandlers();
}

/* ======================
   LOAD COMMENTS
====================== */
async function loadIssueComments(issueId) {
  const { data, error } = await supabase
    .from("issue_comments")
    .select("comment, created_at, users(name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const commentsBox = document.getElementById(`comments-${issueId}`);
  if (!commentsBox) return;

  commentsBox.innerHTML = "";

  data.forEach(c => {
    const p = document.createElement("p");
    p.className = "comment";
    p.innerHTML = `<strong>${c.users?.name || "User"}:</strong> ${c.comment}`;
    commentsBox.appendChild(p);
  });
}

/* ======================
   COMMENT HANDLER
====================== */
function attachCommentHandlers() {
  document.querySelectorAll(".comment-btn").forEach(btn => {
    btn.onclick = async () => {
      const issueId = btn.dataset.id;
      const input = document.querySelector(
        `.comment-input[data-id="${issueId}"]`
      );

      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { error } = await supabase.from("issue_comments").insert({
        issue_id: issueId,
        user_id: user.id,
        comment: text
      });

      if (error) {
        alert("Failed to add comment");
        return;
      }

      input.value = "";
      loadIssueComments(issueId);
    };
  });
}

/* INITIAL LOAD */
loadReports();
