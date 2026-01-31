import { supabase } from "./supabase.js";

/* ======================
   CONFIG
====================== */
const N8N_WEBHOOK_URL =
  "https://avanih.app.n8n.cloud/webhook/assign-caretaker";

let caretakers = [];

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", async () => {
  console.log("ADMIN DASHBOARD LOADED");

  /* ======================
     SIDEBAR + LOGOUT
  ====================== */
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const menuBackdrop = document.getElementById("menuBackdrop");
  const logoutBtn = document.getElementById("logoutBtn");

  menuToggle?.addEventListener("click", () => {
    sidebar.classList.add("open");
    menuBackdrop.classList.add("show");
  });

  menuBackdrop?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    menuBackdrop.classList.remove("show");
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  /* ======================
     AUTH + ROLE GUARD
  ====================== */
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (error || profile.role !== "management") {
    alert("Access denied");
    window.location.href = "student.html";
    return;
  }

  /* ======================
     LOAD DATA
  ====================== */
  await loadCaretakers();
  loadIssueAnalytics();
  loadCategoryAnalytics();
  loadAllIssues();
});
await new Promise(r => setTimeout(r, 500));

/* ======================
   LOAD CARETAKERS
====================== */
async function loadCaretakers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("role", "caretaker");
  console.log("CARETAKERS:", caretakers, error);


  if (error) {
    console.error("Failed to load caretakers", error);
    return;
  }

  caretakers = data;
}

/* ======================
   ISSUE ANALYTICS
====================== */
async function loadIssueAnalytics() {
  const { data: issues, error } = await supabase
    .from("issues")
    .select("status")
    .eq("visibility", "public");

  if (error) {
    console.error("Failed to load issues", error);
    return;
  }

  const total = issues.length;

  // 🔥 Pending === Assigned
  const pending = issues.filter(
    i => i.status === "Assigned"
  ).length;

  const resolved = issues.filter(
    i => i.status === "Resolved"
  ).length;

  updateStats(total, pending, resolved);
  renderIssueChart(pending, resolved);
}

function updateStats(total, pending, resolved) {
  document.getElementById("totalIssues").textContent = total;
  document.getElementById("pendingIssues").textContent = pending;
  document.getElementById("resolvedIssues").textContent = resolved;
}

/* ======================
   CATEGORY ANALYTICS
====================== */
async function loadCategoryAnalytics() {
  const { data, error } = await supabase
    .from("issues")
    .select("category")
    .eq("visibility", "public");

  if (error) {
    console.error("Category analytics error", error);
    return;
  }

  const counts = {};
  data.forEach(i => {
    counts[i.category] = (counts[i.category] || 0) + 1;
  });

  renderCategoryChart(counts);
}

function renderCategoryChart(counts) {
  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(96, 165, 250, 0.65)");
  gradient.addColorStop(0.5, "rgba(96, 165, 250, 0.35)");
  gradient.addColorStop(1, "rgba(96, 165, 250, 0.15)");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(counts),
      datasets: [
  {
    data: Object.values(counts),
    backgroundColor: gradient,
    borderColor: "rgba(147, 197, 253, 0.9)",
    borderWidth: 1.5,
    borderRadius: 14,
    maxBarThickness: 42,   // caps size but allows shrinking
    categoryPercentage: 0.7,
    barPercentage: 0.8
  }
]

    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

/* ======================
   LOAD & RENDER ISSUES
====================== */
async function loadAllIssues() {
  const { data, error } = await supabase
    .from("issues")
    .select(
      "id, description, category, hostel, block, room, status, priority"
    )
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load issues", error);
    return;
  }

  const table = document.getElementById("issuesTable");
  table.innerHTML = "";

  data.forEach(issue => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${issue.description}</td>
      <td>${issue.category}</td>
      <td>${issue.hostel} • ${issue.block} • ${issue.room}</td>

      <td>
        <select class="status-select" data-id="${issue.id}">
          <option value="Reported" ${issue.status === "Reported" ? "selected" : ""}>Reported</option>
          <option value="Pending" ${issue.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Assigned" ${issue.status === "Assigned" ? "selected" : ""}>Assigned</option>
          <option value="Resolved" ${issue.status === "Resolved" ? "selected" : ""}>Resolved</option>
        </select>
      </td>

      <td>
        <select class="caretakerSelect"></select>
      </td>

      <td>
        <button class="assignBtn">Assign</button>
      </td>
    `;

    /* Populate caretakers */
    const caretakerSelect = row.querySelector(".caretakerSelect");
    caretakers.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      caretakerSelect.appendChild(opt);
    });

    /* Assign button */
    row.querySelector(".assignBtn").onclick = () => {
      const caretakerId = caretakerSelect.value;
      const caretaker = caretakers.find(c => c.id === caretakerId);
      assignCaretaker(issue, caretaker);
    };

    table.appendChild(row);
  });

  attachStatusListeners();
}

/* ======================
   STATUS UPDATE
====================== */
function attachStatusListeners() {
  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", async () => {
      const issueId = select.dataset.id;
      const newStatus = select.value;

      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", issueId);

      if (error) {
        alert("Failed to update status");
        console.error(error);
      }
    });
  });
}

/* ======================
   ASSIGN CARETAKER + n8n
====================== */
async function assignCaretaker(issue, caretaker) {
  const { error } = await supabase
    .from("issues")
    .update({
      assigned_to: caretaker.id,
      status: "Assigned",
      assigned_at: new Date().toISOString()
    })
    .eq("id", issue.id);

  if (error) {
    alert("Failed to assign caretaker");
    return;
  }

  await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caretaker_email: caretaker.email,
      caretaker_name: caretaker.name,
      category: issue.category,
      description: issue.description,
      location: `${issue.hostel} • ${issue.block} • ${issue.room}`,
      priority: issue.priority
    })
  });

  alert("Caretaker assigned & email sent");
}

/* ======================
   DONUT CHART
====================== */
function renderIssueChart(pending, resolved) {
  const canvas = document.getElementById("issueChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Pending", "Resolved"],
      datasets: [
        {
          data: [pending, resolved],
          backgroundColor: ["#facc15", "#22c55e"],
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: { legend: { display: false } }
    }
  });
}
