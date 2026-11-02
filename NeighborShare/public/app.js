const API = "/api";
const itemGrid = document.getElementById("item-grid");
const itemForm = document.getElementById("item-form");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("category-filter");
const requestList = document.getElementById("request-list");
let allItems = [];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function safeImage(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {}
  return "https://placehold.co/600x400/e8f2e9/286849?text=NeighborShare";
}

async function apiRequest(url, options = {}) {
  const response = await fetch(API + url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

async function loadItems() {
  try {
    allItems = await apiRequest("/items");
    document.getElementById("item-count").textContent = allItems.length;
    displayItems();
  } catch (error) {
    itemGrid.innerHTML = `<p>Could not load items. ${escapeHTML(error.message)}</p>`;
  }
}

function displayItems() {
  const search = searchInput.value.toLowerCase().trim();
  const category = categoryFilter.value;
  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search);
    return matchesSearch && (category === "All" || item.category === category);
  });

  if (!filteredItems.length) {
    itemGrid.innerHTML = "<p>No items found. Try another search!</p>";
    return;
  }

  itemGrid.innerHTML = filteredItems.map(item => `
    <article class="item-card">
      <img class="item-image" src="${escapeHTML(safeImage(item.image))}"
        alt="${escapeHTML(item.name)}"
        onerror="this.onerror=null;this.src='https://placehold.co/600x400/e8f2e9/286849?text=No+Image'">
      <div class="item-info">
        <span class="category-tag">${escapeHTML(item.category)}</span>
        <h3>${escapeHTML(item.name)}</h3>
        <p>${escapeHTML(item.description)}</p>
        <div class="item-owner">Shared by <strong>${escapeHTML(item.owner)}</strong></div>
        ${item.available
          ? `<button class="borrow-btn" onclick="borrowItem(${item.id})">Request to borrow ↗</button>`
          : `<span class="status">Currently borrowed</span>`}
        <button class="delete-btn" onclick="deleteItem(${item.id})">Delete listing</button>
      </div>
    </article>
  `).join("");
}

itemForm.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.getElementById("form-message");
  const item = {
    owner: document.getElementById("owner").value,
    name: document.getElementById("name").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    image: document.getElementById("image").value
  };

  try {
    await apiRequest("/items", { method: "POST", body: JSON.stringify(item) });
    message.textContent = "Your item was shared successfully! 💚";
    itemForm.reset();
    await loadItems();
    document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    message.textContent = error.message;
  }
});

searchInput.addEventListener("input", displayItems);
categoryFilter.addEventListener("change", displayItems);

async function borrowItem(id) {
  const borrower = prompt("Enter your name to request this item:");
  if (!borrower || !borrower.trim()) return;
  try {
    await apiRequest("/requests", {
      method: "POST",
      body: JSON.stringify({ itemId: id, borrower: borrower.trim() })
    });
    alert("Your borrow request has been sent! 💚");
    await loadRequests();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteItem(id) {
  if (!confirm("Are you sure you want to delete this listing?")) return;
  try {
    await apiRequest(`/items/${id}`, { method: "DELETE" });
    alert("Listing deleted successfully!");
    await loadItems();
    await loadRequests();
  } catch (error) {
    alert(error.message);
  }
}

async function loadRequests() {
  try {
    const requests = await apiRequest("/requests");
    if (!requests.length) {
      requestList.innerHTML = "<p>No borrow requests yet.</p>";
      return;
    }
    requestList.innerHTML = requests.map(request => `
      <div class="request-card">
        <div>
          <h3>${escapeHTML(request.itemName)}</h3>
          <p>Requested by ${escapeHTML(request.borrower)} · Owner: ${escapeHTML(request.owner)}</p>
          <p>${new Date(request.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="request-actions">
          ${request.status === "Pending" ? `
            <button class="accept-btn" onclick="updateRequest(${request.id}, 'Accepted')">Accept</button>
            <button class="reject-btn" onclick="updateRequest(${request.id}, 'Rejected')">Reject</button>
          ` : `<span class="status">${escapeHTML(request.status)}</span>`}
        </div>
      </div>
    `).join("");
  } catch (error) {
    requestList.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
  }
}

async function updateRequest(id, status) {
  try {
    await apiRequest(`/requests/${id}`, {
      method: "PATCH", body: JSON.stringify({ status })
    });
    alert(`Request ${status.toLowerCase()} successfully!`);
    await loadRequests();
    await loadItems();
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById("refresh-requests").addEventListener("click", loadRequests);
loadItems();
loadRequests();
