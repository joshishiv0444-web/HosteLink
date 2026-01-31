
import { supabase } from "./supabase.js";
const nameInput = document.getElementById("name"); // only present on signup page
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

/* ======================
   SIGN UP (STUDENT ONLY)
====================== */
if (signupBtn) {
  signupBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = document.getElementById("name")?.value.trim() || null;

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const userId = data.user.id;

    // ✅ check profile using id (NOT profile_id)
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from("users")
        .insert({
          id: userId,
          name,
          role: "student",
          hostel: "A",
          block: "B",
          room: "101"
        });

      if (profileError) {
        console.error("Profile insert failed:", profileError);
      }
    }

    alert("Signup successful. Verify email, then login.");
    window.location.href = "login.html";
  };



  

/* LOGIN */
/* LOGIN */
/* LOGIN */
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      alert("Auth failed");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    if (profileError || !profile) {
      alert("Profile missing. Please contact admin.");
      return;
    }

    // if (profile.role === "management") {
    //   window.location.href = "admin.html";
    // } else {
    //   window.location.href = "student.html";
    // }
  };
}





  if (profile.role === "management") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "student.html";
  }
};




