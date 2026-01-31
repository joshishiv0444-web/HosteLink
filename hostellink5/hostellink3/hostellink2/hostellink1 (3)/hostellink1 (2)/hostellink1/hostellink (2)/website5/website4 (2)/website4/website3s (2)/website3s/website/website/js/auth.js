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
}


  

/* LOGIN */
if (loginBtn) {
  loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

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
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    alert("Profile fetch failed");
    return;
  }

  if (!profile) {
  // auto-create profile
  await supabase.from("users").insert({
    id: auth.user.id,
    role: "student",
    name: user.email.split("@")[0]
  });

  // reload page once
  location.reload();
  return;
}


  if (profile.role === "management") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "student.html";
  }
};

}


