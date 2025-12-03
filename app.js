const API_BASE = "api.php"; // same folder as index.html

const productForm = document.getElementById("productForm");
const formMessage = document.getElementById("formMessage");
const listMessage = document.getElementById("listMessage");
const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");

// Load products initially
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();

    searchInput.addEventListener("input", () => {
        filterProducts(searchInput.value.trim().toLowerCase());
    });
});

productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formMessage.textContent = "";
    formMessage.className = "message";

    const data = {
        farmer_name: document.getElementById("farmer_name").value.trim(),
        crop_name: document.getElementById("crop_name").value.trim(),
        quantity_kg: document.getElementById("quantity_kg").value.trim(),
        price_per_kg: document.getElementById("price_per_kg").value.trim(),
        location: document.getElementById("location").value.trim(),
        contact_phone: document.getElementById("contact_phone").value.trim(),
    };

    // Basic validation
    if (!data.farmer_name || !data.crop_name || !data.quantity_kg || !data.price_per_kg ||
        !data.location || !data.contact_phone) {
        formMessage.textContent = "Please fill all fields.";
        formMessage.classList.add("error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}?action=add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
            formMessage.textContent = result.message || "Listing added!";
            formMessage.classList.add("success");
            productForm.reset();
            fetchProducts(); // refresh list
        } else {
            formMessage.textContent = result.message || "Something went wrong.";
            formMessage.classList.add("error");
        }
    } catch (err) {
        console.error(err);
        formMessage.textContent = "Network error while submitting.";
        formMessage.classList.add("error");
    }
});

let allProducts = [];

async function fetchProducts() {
    listMessage.textContent = "Loading products...";
    productsContainer.innerHTML = "";

    try {
        const res = await fetch(`${API_BASE}?action=list`);
        const result = await res.json();

        if (!result.success) {
            listMessage.textContent = result.message || "Failed to load products.";
            return;
        }

        allProducts = result.data || [];

        if (allProducts.length === 0) {
            listMessage.textContent = "No products listed yet.";
            return;
        }

        listMessage.textContent = "";
        renderProducts(allProducts);
    } catch (err) {
        console.error(err);
        listMessage.textContent = "Network error while loading products.";
    }
}

function renderProducts(products) {
    productsContainer.innerHTML = "";

    products.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <div class="product-header">
                <h3>${escapeHtml(p.crop_name)}</h3>
                <span class="price-chip">₹${Number(p.price_per_kg).toFixed(2)}/kg</span>
            </div>
            <div class="meta">
                <span><strong>Farmer:</strong> ${escapeHtml(p.farmer_name)}</span>
                <span><strong>Quantity:</strong> ${Number(p.quantity_kg)} kg</span>
                <span><strong>Location:</strong> ${escapeHtml(p.location)}</span>
                <span><strong>Contact:</strong> ${escapeHtml(p.contact_phone)}</span>
            </div>
        `;

        productsContainer.appendChild(card);
    });
}

function filterProducts(query) {
    if (!query) {
        renderProducts(allProducts);
        return;
    }

    const filtered = allProducts.filter((p) => {
        const crop = (p.crop_name || "").toLowerCase();
        const location = (p.location || "").toLowerCase();
        return crop.includes(query) || location.includes(query);
    });

    renderProducts(filtered);

    if (filtered.length === 0) {
        listMessage.textContent = "No matching products found.";
    } else {
        listMessage.textContent = "";
    }
}

// Small helper to avoid XSS with innerHTML
function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
