import { supabase } from "./supabase.js";

const form = document.getElementById("issueForm");

if (!form) {
  console.error("issueForm not found")
} else{


  form.addEventListener("submit", async (e)=> {
    e.preventDefault(); // 🔥 STOPS 405 ERROR
    /* ======================
       READ FORM VALUES
    ====================== */
    const category = document.getElementById("category").value;
    const priority = document.getElementById("priority").value;
    const description = document.getElementById("description").value;
    const isPublic = document.getElementById("isPublic").checked;
    const visibility = isPublic ? "public" : "private";

    const imageFile = document.getElementById("issueImage").files[0];

    const hostel = document.getElementById("hostel").value.trim();
    const block = document.getElementById("block").value.trim();
    const room = document.getElementById("room").value.trim();

    if (!category || !priority || !description) {
      alert("Please fill all issue details");
      return;
    }

    if (!hostel || !block || !room) {
      alert("Please fill hostel, block and room");
      return;
    }



    /* ======================
       AUTH CHECK
    ====================== */
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      alert("Not logged in");
      return;
    }

    /* ======================
       IMAGE UPLOAD (OPTIONAL)
    ====================== */
    let imageUrl = null;

    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `issues/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("issue-images")
        .upload(filePath, imageFile);

      if (uploadError) {
        alert("Image upload failed");
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("issue-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    /* ======================
       INSERT ISSUE (FINAL)
    ====================== */
    const { error } = await supabase.from("issues").insert({
      user_id: user.id,
      category,
      priority,
      description,
      visibility,
      image_url: imageUrl,
      hostel: hostel,
      block: block,
      room: room,
      status: "Reported"
    });

    if (error) {
      alert("Failed to submit issue");
      console.error(error);
      return;
    }

    alert("Issue reported successfully");
    window.location.href = "student.html";
  });
}
