import { supabase } from "./supabase.js";

/* ELEMENTS */
const lostBtn = document.getElementById("lostBtn");
const foundBtn = document.getElementById("foundBtn");
const itemsList = document.getElementById("itemsList");

/* SAFETY CHECK */
if (!itemsList) {
  console.error("itemsList element not found in HTML");
}

/* SUBMIT LOST ITEM */
lostBtn.onclick = async () => {
  await submitItem(
    "lost",
    lostItemName.value,
    lostLocation.value,
    lostDesc.value,
    lostImage.files[0]
  );
};

/* SUBMIT FOUND ITEM */
foundBtn.onclick = async () => {
  await submitItem(
    "found",
    foundItemName.value,
    foundLocation.value,
    foundDesc.value,
    foundImage.files[0]
  );
};

async function submitItem(type, name, location, desc, imageFile) {
  if (!name) {
    alert("Item name is required");
    return;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    alert("Not logged in");
    return;
  }

  let imageUrl = null;

  /* UPLOAD IMAGE */
  if (imageFile) {
    const filePath = `${Date.now()}-${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("lost-found")
      .upload(filePath, imageFile);

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("lost-found")
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl;
  }

  /* INSERT INTO DB */
  const { error } = await supabase.from("lost_found").insert({
    user_id: auth.user.id,
    type,
    item_name: name,
    location,
    description: desc,
    image_url: imageUrl
  });

  if (error) {
    alert(error.message);
    return;
  }

  /* RESET FORM */
  lostItemName.value = "";
  lostLocation.value = "";
  lostDesc.value = "";
  lostImage.value = "";
  foundItemName.value = "";
  foundLocation.value = "";
  foundDesc.value = "";
  foundImage.value = "";

  loadItems();
}

/* LOAD ITEMS */
async function loadItems() {
  const { data, error } = await supabase
    .from("lost_found")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  itemsList.innerHTML = "";

  data.forEach(item => {
    itemsList.innerHTML += `
      <div class="issue-card">
        <strong>${item.item_name}</strong>
        <span class="badge">${item.type}</span>
        <p>${item.location || ""}</p>

        ${
          item.image_url
            ? `<img src="${item.image_url}" class="item-image">`
            : ""
        }
      </div>
    `;
  });
}



loadItems();
