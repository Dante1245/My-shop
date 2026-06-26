const PRODUCTS = [
  { id: 1, name: "Apex Oversized Tee", category: "Tops", price: 42, rating: 4.8, emoji: "👕", tags: ["cotton", "street"], vibe: "bold", fit: "oversized", focus: "statement" },
  { id: 2, name: "Motion Cargo Pants", category: "Bottoms", price: 78, rating: 4.7, emoji: "👖", tags: ["utility", "relaxed"], vibe: "minimal", fit: "relaxed", focus: "utility" },
  { id: 3, name: "Dantes Windbreaker", category: "Outerwear", price: 110, rating: 4.9, emoji: "🧥", tags: ["limited", "lightweight"], vibe: "sport", fit: "relaxed", focus: "utility" },
  { id: 4, name: "Midnight Hoodie", category: "Tops", price: 89, rating: 4.9, emoji: "🧢", tags: ["heavyweight", "premium"], vibe: "bold", fit: "oversized", focus: "comfort" },
  { id: 5, name: "Rush Track Shorts", category: "Bottoms", price: 55, rating: 4.6, emoji: "🩳", tags: ["active", "quickdry"], vibe: "sport", fit: "fitted", focus: "comfort" },
  { id: 6, name: "Signal Bomber", category: "Outerwear", price: 138, rating: 4.8, emoji: "🥼", tags: ["reflective", "capsule"], vibe: "bold", fit: "relaxed", focus: "statement" },
  { id: 7, name: "Core Rib Tank", category: "Tops", price: 32, rating: 4.4, emoji: "🎽", tags: ["summer", "minimal"], vibe: "minimal", fit: "fitted", focus: "comfort" },
  { id: 8, name: "Pivot Denim", category: "Bottoms", price: 98, rating: 4.5, emoji: "👖", tags: ["baggy", "vintage"], vibe: "minimal", fit: "oversized", focus: "statement" }
];

const TESTIMONIALS = [
  { name: "Jalen R.", text: "Quality is insane. Every piece feels premium and fits perfectly.", city: "Los Angeles" },
  { name: "Mia T.", text: "The drop alerts and quick checkout are so smooth.", city: "New York" },
  { name: "Dario M.", text: "DANTES STREET CO. is now my go-to for daily outfits.", city: "Chicago" }
];

const liveMessages = [
  "🔥 12 people are viewing the SS26 drop right now.",
  "⚡ 4 carts checked out in the last 10 minutes.",
  "🖤 New members unlocked early access pricing.",
  "🚚 Free shipping is active on orders above $120."
];

const STYLE_STORIES = {
  night: {
    slug: "night-motion",
    title: "Night Motion",
    text: "Built for after-dark city movement with reflective detailing and oversized confidence.",
    picks: [4, 6]
  },
  utility: {
    slug: "urban-utility",
    title: "Urban Utility",
    text: "Practical fits for everyday travel, layered weather resistance, and comfort-first design.",
    picks: [2, 3]
  },
  minimal: {
    slug: "minimal-core",
    title: "Minimal Core",
    text: "Clean tones and timeless shapes you can style all year with effortless ease.",
    picks: [1, 7]
  }
};

const state = {
  filter: "All",
  sort: "featured",
  query: "",
  cart: JSON.parse(localStorage.getItem("dantes-cart") ?? "[]"),
  theme: localStorage.getItem("dantes-theme") ?? "light",
  recentlyViewed: JSON.parse(localStorage.getItem("dantes-recent") ?? "[]"),
  wishlist: JSON.parse(localStorage.getItem("dantes-wishlist") ?? "[]")
};

const $ = (selector) => document.querySelector(selector);
const productGrid = $("#product-grid");
const wishlistGrid = $("#wishlist-grid");
const recentGrid = $("#recent-grid");
const filtersWrap = $("#filters");
const cartDrawer = $("#cart-drawer");
const cartItems = $("#cart-items");
const cartTotal = $("#cart-total");
const cartCount = $("#cart-count");
const quickView = $("#quick-view");
const toast = $("#toast");

function init() {
  initTheme();
  renderFilters();
  renderProducts();
  renderWishlist();
  renderTestimonials();
  renderCart();
  renderRecentlyViewed();
  initOutfitBuilder();
  bindEvents();
  startCountdown();
  startLiveBanner();
  hydrateSpinState();
  initBrowserContainer();
}

function initTheme() {
  if (state.theme === "dark") {
    document.body.classList.add("dark");
    $("#theme-toggle").textContent = "🌙";
  }
}

function bindEvents() {
  $("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value.toLowerCase();
    renderProducts();
  });

  $("#sort-select").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  $("#theme-toggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    state.theme = dark ? "dark" : "light";
    localStorage.setItem("dantes-theme", state.theme);
    $("#theme-toggle").textContent = dark ? "🌙" : "☀️";
    notify(`Theme changed to ${dark ? "dark" : "light"} mode.`);
  });

  $("#open-cart").addEventListener("click", () => toggleCart(true));
  $("#close-cart").addEventListener("click", () => toggleCart(false));

  $("#checkout-btn").addEventListener("click", () => {
    if (!state.cart.length) {
      notify("Your cart is empty.");
      return;
    }
    notify("Checkout initialized. (Demo mode)");
  });

  $("#close-quick-view").addEventListener("click", () => quickView.close());

  $("#size-guide-btn").addEventListener("click", () => $("#size-guide").showModal());
  $("#close-size-guide").addEventListener("click", () => $("#size-guide").close());

  $("#newsletter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = $("#email").value.trim();
    if (!email) {
      return;
    }
    notify(`You're in! ${email} subscribed.`);
    event.target.reset();
  });

  $("#dna-form").addEventListener("submit", handleDnaQuiz);
  $("#spin-btn").addEventListener("click", handleDailySpin);
  $("#outfit-form").addEventListener("submit", handleOutfitBuilder);
}

function renderFilters() {
  const categories = ["All", ...new Set(PRODUCTS.map((product) => product.category))];
  filtersWrap.innerHTML = categories
    .map(
      (category) =>
        `<button class="filter-chip ${state.filter === category ? "active" : ""}" data-category="${category}">${category}</button>`
    )
    .join("");

  filtersWrap.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.filter = chip.dataset.category;
      renderFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const filtered = PRODUCTS
    .filter((product) => state.filter === "All" || product.category === state.filter)
    .filter((product) => {
      const haystack = `${product.name} ${product.tags.join(" ")}`.toLowerCase();
      return haystack.includes(state.query);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (state.sort === "low") return a.price - b.price;
    if (state.sort === "high") return b.price - a.price;
    if (state.sort === "rating") return b.rating - a.rating;
    return a.id - b.id;
  });

  productGrid.innerHTML = sorted
    .map((product) => renderProductCard(product, true))
    .join("");

  if (!sorted.length) {
    productGrid.innerHTML = "<p>No products found. Try another filter or search term.</p>";
  }
}

function renderProductCard(product, withQuickView) {
  return `
      <article class="card">
        <div class="thumb">${product.emoji}</div>
        <div class="card-body">
          <h3>${product.name}</h3>
          <p class="tags">${product.tags.join(" • ")}</p>
          <div class="price-row">
            <strong>$${product.price}</strong>
            <span>⭐ ${product.rating}</span>
          </div>
          <div class="card-actions">
            <button class="btn primary" onclick="addToCart(${product.id})">Add to Cart</button>
            ${withQuickView ? `<button class="btn ghost" onclick="openQuickView(${product.id})">Quick View</button>` : ""}
            <button class="btn ghost" onclick="toggleWishlist(${product.id})">${state.wishlist.includes(product.id) ? "♥ Saved" : "♡ Save"}</button>
          </div>
        </div>
      </article>
    `;
}

function renderTestimonials() {
  $("#testimonial-slider").innerHTML = TESTIMONIALS.map(
    (t) => `<article class="testimonial"><p>“${t.text}”</p><strong>${t.name}</strong><span class="subtle"> • ${t.city}</span></article>`
  ).join("");
}

function addToCart(productId) {
  const item = PRODUCTS.find((product) => product.id === productId);
  state.cart.push(item);
  persistCart();
  renderCart();
  notify(`${item.name} added to cart.`);
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  persistCart();
  renderCart();
}

function persistCart() {
  localStorage.setItem("dantes-cart", JSON.stringify(state.cart));
}

function renderCart() {
  cartItems.innerHTML = state.cart.length
    ? state.cart
        .map(
          (item, index) => `
          <div class="cart-item">
            <div>
              <strong>${item.name}</strong>
              <p class="subtle">$${item.price}</p>
            </div>
            <button class="btn ghost" onclick="removeFromCart(${index})">Remove</button>
          </div>
        `
        )
        .join("")
    : "<p>Your cart is empty.</p>";

  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = `$${total}`;
  cartCount.textContent = String(state.cart.length);
}

function toggleCart(open) {
  cartDrawer.classList.toggle("open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
}

function openQuickView(productId) {
  const item = PRODUCTS.find((product) => product.id === productId);
  trackRecentlyViewed(item.id);
  $("#quick-view-content").innerHTML = `
    <div class="thumb" style="min-height:220px">${item.emoji}</div>
    <h3>${item.name}</h3>
    <p>${item.tags.join(" • ")}</p>
    <p><strong>$${item.price}</strong> • ⭐ ${item.rating}</p>
    <button class="btn primary" onclick="addToCart(${item.id});document.querySelector('#quick-view').close();">Add to Cart</button>
  `;
  quickView.showModal();
}

function trackRecentlyViewed(productId) {
  state.recentlyViewed = [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 4);
  localStorage.setItem("dantes-recent", JSON.stringify(state.recentlyViewed));
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  if (!state.recentlyViewed.length) {
    recentGrid.innerHTML = '<p class="subtle">No recent views yet. Open Quick View on any product.</p>';
    return;
  }

  const items = state.recentlyViewed
    .map((id) => PRODUCTS.find((product) => product.id === id))
    .filter(Boolean);

  recentGrid.innerHTML = items.map((item) => renderProductCard(item, false)).join("");
}



function renderWishlist() {
  if (!state.wishlist.length) {
    wishlistGrid.innerHTML = '<p class="subtle">No saved pieces yet. Tap “♡ Save” on any product card.</p>';
    return;
  }

  const items = state.wishlist
    .map((id) => PRODUCTS.find((product) => product.id === id))
    .filter(Boolean);

  wishlistGrid.innerHTML = items.map((item) => renderProductCard(item, true)).join("");
}

function toggleWishlist(productId) {
  if (state.wishlist.includes(productId)) {
    state.wishlist = state.wishlist.filter((id) => id !== productId);
    notify("Removed from wishlist.");
  } else {
    state.wishlist = [productId, ...state.wishlist];
    notify("Added to wishlist.");
  }

  localStorage.setItem("dantes-wishlist", JSON.stringify(state.wishlist));
  renderProducts();
  renderWishlist();
}

function initOutfitBuilder() {
  fillOutfitOptions("outfit-top", "Tops");
  fillOutfitOptions("outfit-bottom", "Bottoms");
  fillOutfitOptions("outfit-outer", "Outerwear");
}

function fillOutfitOptions(selectId, category) {
  const select = $(`#${selectId}`);
  const options = PRODUCTS.filter((product) => product.category === category)
    .map((product) => `<option value="${product.id}">${product.name} - $${product.price}</option>`)
    .join("");
  select.innerHTML = options;
}

function handleOutfitBuilder(event) {
  event.preventDefault();
  const ids = ["outfit-top", "outfit-bottom", "outfit-outer"].map((id) => Number($(`#${id}`).value));
  const items = ids.map((id) => PRODUCTS.find((product) => product.id === id)).filter(Boolean);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  $("#outfit-result").innerHTML = `Your build: <strong>${items.map((item) => item.name).join(" + ")}</strong><br/>Bundle total: <strong>$${total}</strong> <button class="btn ghost" onclick="addOutfitBundle('${ids.join(",")}')">Add Bundle to Cart</button>`;
}

function addOutfitBundle(serializedIds) {
  const ids = serializedIds.split(",").map(Number);
  ids.forEach((id) => {
    const item = PRODUCTS.find((product) => product.id === id);
    if (item) {
      state.cart.push(item);
    }
  });
  persistCart();
  renderCart();
  notify("Outfit bundle added to cart.");
}

function handleDnaQuiz(event) {
  event.preventDefault();
  const vibe = $("#vibe").value;
  const fit = $("#fit").value;
  const focus = $("#focus").value;

  const match = PRODUCTS
    .map((product) => ({
      ...product,
      score:
        Number(product.vibe === vibe) +
        Number(product.fit === fit) +
        Number(product.focus === focus)
    }))
    .sort((a, b) => b.score - a.score || b.rating - a.rating)[0];

  const result = $("#dna-result");
  result.innerHTML = `Your Style DNA match is <strong>${match.name}</strong> (${match.emoji}) — $${match.price}. <button class="btn ghost" onclick="openQuickView(${match.id})">Preview Match</button>`;
  notify(`${match.name} is your style match.`);
}

function handleDailySpin() {
  const key = new Date().toISOString().slice(0, 10);
  const lastSpin = localStorage.getItem("dantes-spin-date");
  if (lastSpin === key) {
    notify("You already spun today. Come back tomorrow!");
    return;
  }

  const rewards = [5, 10, 12, 15, 20];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];
  const code = `DANTES${reward}`;
  localStorage.setItem("dantes-spin-date", key);
  localStorage.setItem("dantes-spin-code", code);
  $("#spin-status").textContent = `Today's reward unlocked: ${reward}% OFF with code ${code}.`;
  notify(`🎉 You won ${reward}% off! Use code ${code}.`);
}

function hydrateSpinState() {
  const code = localStorage.getItem("dantes-spin-code");
  const date = localStorage.getItem("dantes-spin-date");
  const today = new Date().toISOString().slice(0, 10);
  if (code && date === today) {
    $("#spin-status").textContent = `Today's reward unlocked: ${code}.`;
  }
}

function startLiveBanner() {
  let index = 0;
  setInterval(() => {
    index = (index + 1) % liveMessages.length;
    $("#live-banner").textContent = liveMessages[index];
  }, 4000);
}



function initBrowserContainer() {
  const savedStory = localStorage.getItem("dantes-lookbook") || "night";
  renderBrowserStory(savedStory);

  document.querySelectorAll(".tab-btn").forEach((tab) => {
    tab.addEventListener("click", () => {
      const story = tab.dataset.story;
      localStorage.setItem("dantes-lookbook", story);
      renderBrowserStory(story);
    });
  });
}

function renderBrowserStory(storyKey) {
  const story = STYLE_STORIES[storyKey] || STYLE_STORIES.night;
  const picks = story.picks
    .map((id) => PRODUCTS.find((product) => product.id === id))
    .filter(Boolean)
    .map((product) => `<button class="btn ghost" onclick="openQuickView(${product.id})">${product.emoji} ${product.name}</button>`)
    .join(" ");

  $("#browser-url").textContent = `https://dantesstreet.co/lookbook/${story.slug}`;
  $("#browser-content").innerHTML = `
    <h3>${story.title}</h3>
    <p>${story.text}</p>
    <p class="subtle">Featured picks:</p>
    <div class="browser-picks">${picks}</div>
  `;

  document.querySelectorAll(".tab-btn").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.story === storyKey);
  });
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function startCountdown() {
  const target = new Date();
  target.setDate(target.getDate() + 6);

  setInterval(() => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      $("#countdown").textContent = "Drop is live now!";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    $("#countdown").textContent = `${String(days).padStart(2, "0")}d : ${String(hours).padStart(2, "0")}h : ${String(mins).padStart(2, "0")}m : ${String(secs).padStart(2, "0")}s`;
  }, 1000);
}

window.addToCart = addToCart;
window.openQuickView = openQuickView;
window.removeFromCart = removeFromCart;
window.toggleWishlist = toggleWishlist;
window.addOutfitBundle = addOutfitBundle;

init();
