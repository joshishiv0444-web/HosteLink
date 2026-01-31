import { supabase } from "./supabase.js";

document.getElementById("logoutBtn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
};
