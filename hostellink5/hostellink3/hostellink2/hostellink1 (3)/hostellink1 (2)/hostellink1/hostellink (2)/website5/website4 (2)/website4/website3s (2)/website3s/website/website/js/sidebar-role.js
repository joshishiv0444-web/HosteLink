import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (error || !profile) return;

  const role = profile.role;

  document.querySelectorAll("[data-role]").forEach(link => {
    const allowedRoles = link.dataset.role.split(" ");
    if (!allowedRoles.includes(role)) {
      link.style.display = "none";
    }
  });
});
