import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    window.location.href = "login.html";
    return;
  }

  loadMyIssues(auth.user.id);
});

async function loadMyIssues(userId) {
  const { data, error } = await supabase
    .from("issues")
    .select("id, category, status, hostel, block, room")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("myIssuesContainer");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p>No issues reported yet.</p>";
    return;
  }

  data.forEach(issue => {
    const card = document.createElement("div");
    card.className = "issue-card";

    card.innerHTML = `
      <h3>${issue.category} • ${issue.block}</h3>
      <div class="status-bar status-${issue.status.toLowerCase()}">
        ${issue.status}
      </div>
      
    `;

    container.appendChild(card);
  });


}
