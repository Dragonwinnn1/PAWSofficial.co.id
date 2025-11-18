/**
 * Perbaikan script utama:
 * - Nav toggling (artikel <-> collection)
 * - Wishlist modal (lihat & hapus)
 * - Banner menggantikan hero
 * - Hapus filter/search (sesuai permintaan)
 *
 * Jangan lupa ganti WHATSAPP_NUMBER, TELEGRAM_USERNAME, dan gambar sesuai asset Anda.
 */

/* ========== CONFIG ========== */
const WHATSAPP_NUMBER = "6287785981177"; // GANTI NOMOR ANDA
const TELEGRAM_USERNAME = "pawsfck"; // GANTI USERNAME TELEGRAM ANDA (tanpa '@')
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FLAT = 20000;

// === DATA BARU UNTUK BANNER CAROUSEL ===
const BANNERS = [
  // Pastikan Anda memiliki file gambar ini: hero-distro.jpg, banner-new-promo.jpg, banner-outfit.jpg
  { img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/Screenshot_2.png?raw=true", alt: "PAWS Banner - T-Shirt Collection", link: "#" },
  { img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/Screenshot_3.png?raw=true", alt: "Special Promo: Free Sticker Pack", link: "#" },
  { img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/Screenshot_4.png?raw=true", alt: "Lookbook - Casual Outfit Idea", link: "#" }
];
// ========================================

/* ========== SAMPLE PRODUCTS ========== */
const PRODUCTS = [
  { id: "p1", name: "Urban Mischief Tee", price: 249000, images: ["https://dnd.dlps.my.id/wp-content/uploads/2025/11/spectre-ls-7-b1-600x600.jpg"], category: ["kaos","new-drop"], description: "Cotton Combed 30s. Regular Fit.", variants: { S: 5, M: 7, L: 3, XL: 0 } },
  { id: "p2", name: "Black & White Anarchy Hoodie", price: 489000, images: ["https://dnd.dlps.my.id/wp-content/uploads/2025/10/p-squad-blk1-768x768.jpg"], category: ["jaket","sale"], description: "Fleece 280gsm. Oversize Fit.", variants: { S: 1, M: 4, L: 2, XL: 1 } },
  { id: "p3", name: "Cargo Pants Black V3", price: 399000, images: ["https://dnd.dlps.my.id/wp-content/uploads/2025/06/throw-1m-1-768x768.jpg"], category: ["celana","new-drop"], description: "Twill premium. Slim tapered.", variants: { S: 2, M: 8, L: 6, XL: 4 } },
  { id: "p4", name: "Snapback Original", price: 199000, images: ["https://dnd.dlps.my.id/wp-content/uploads/2025/09/solid-5panel-1-768x768.jpg"], category: ["aksesoris","new-drop"], description: "Polyester drill. Adjustable strap.", variants: { OneSize: 30 } }
];

/* ========== STATE ========== */
let state = {
  products: PRODUCTS,
  filter: { priceMin: 0, category: "all", q: "" },
  cart: load("paws_cart") || [],
  wishlist: load("paws_wishlist") || [],
  user: load("paws_user") || null,
  currentBannerIndex: 0 // BARU: State untuk melacak banner saat ini
};

/* ========== DOM ========== */
const productGrid = document.getElementById("product-grid");
const cartCountEl = document.getElementById("cart-count");
const wishlistCountEl = document.getElementById("wishlist-count");
const collectionTitle = document.getElementById("collection-title");
const modalProduct = document.getElementById("modal-product");
const modalCart = document.getElementById("modal-cart");
const modalWishlist = document.getElementById("modal-wishlist");
const modalCheckout = document.getElementById("modal-checkout");
const modalLogin = document.getElementById("modal-login");
const cartContents = document.getElementById("cart-contents");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartShippingEl = document.getElementById("cart-shipping");
const cartTotalEl = document.getElementById("cart-total");
const wishlistContents = document.getElementById("wishlist-contents");
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();
if (document.getElementById("year-copy")) document.getElementById("year-copy").textContent = new Date().getFullYear(); // Tambahan untuk copyright

// BARU: Elemen untuk Banner Carousel
const bannerContainer = document.getElementById("banner-container");
const bannerPrevBtn = document.getElementById("banner-prev");
const bannerNextBtn = document.getElementById("banner-next");


/* ========== UTILS ========== */
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key){ try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function rupiah(n){ return `Rp ${Number(n).toLocaleString("id-ID")}`; }

/* ========== NAV & ACTIVE STATE ========== */
function clearActiveNav(){
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}
function setActiveNav(btnEl){
  clearActiveNav();
  if(btnEl) btnEl.classList.add('active');
}

/* Nav handlers */
document.getElementById("btn-newdrop").onclick = () => {
  setActiveNav(document.getElementById("btn-newdrop"));
  collectionTitle.textContent = "NEW DROP";
  showSection('collection');
  state.filter.category = "all"; renderProducts();
};
document.getElementById("btn-sale").onclick = () => {
  setActiveNav(document.getElementById("btn-sale"));
  collectionTitle.textContent = "SALE";
  showSection('collection');
  state.filter.category = "sale"; renderProducts();
};
document.getElementById("btn-collection").onclick = () => {
  setActiveNav(document.getElementById("btn-collection"));
  collectionTitle.textContent = "ALL COLLECTION";
  showSection('collection'); state.filter.category = "all"; renderProducts();
};
document.getElementById("btn-article").onclick = () => {
  setActiveNav(document.getElementById("btn-article"));
  showSection('article');
};

/* brand logo click -> home (collection) */
document.getElementById("brand-link").onclick = (e) => { e.preventDefault(); document.getElementById("btn-newdrop").click(); };

/* Show/hide sections helper */
function showSection(name){
  const coll = document.getElementById("collection");
  const art = document.getElementById("article");
  const hero = document.getElementById("hero");
  if(name === 'article'){ 
    coll.style.display = 'none'; 
    art.style.display = 'block'; 
    if(hero) hero.style.display = 'none'; // Sembunyikan banner di halaman artikel
  }
  else { 
    art.style.display = 'none'; 
    coll.style.display = 'block'; 
    if(hero) hero.style.display = 'block'; // Tampilkan banner di halaman collection
  }
}

/* ========== BANNER CAROUSEL LOGIC ========== */
function renderBanner(){
    if(!bannerContainer) return;
    bannerContainer.innerHTML = "";
    BANNERS.forEach((banner, index) => {
        const isActive = index === state.currentBannerIndex;
        const bannerEl = document.createElement("a");
        bannerEl.href = banner.link || "#";
        bannerEl.className = `hero-banner-item ${isActive ? 'active' : ''}`;
        bannerEl.innerHTML = `<img src="${banner.img}" alt="${banner.alt}" loading="lazy" />`;
        bannerContainer.appendChild(bannerEl);
    });
}

function nextBanner(){
    state.currentBannerIndex = (state.currentBannerIndex + 1) % BANNERS.length;
    renderBanner();
}

function prevBanner(){
    state.currentBannerIndex = (state.currentBannerIndex - 1 + BANNERS.length) % BANNERS.length;
    renderBanner();
}

function attachBannerListeners(){
    if (bannerPrevBtn) bannerPrevBtn.onclick = prevBanner;
    if (bannerNextBtn) bannerNextBtn.onclick = nextBanner;

    // Auto-rotate every 5 seconds (5000ms)
    setInterval(nextBanner, 5000);
}


/* ========== PRODUCT RENDER ========== */
function renderProducts(){
  productGrid.innerHTML = "";
  let items = state.products.slice();

  // category filter logic (sale/new-drop/all)
  if(state.filter.category === 'sale') items = items.filter(p => p.category.includes('sale'));
  else if(state.filter.category === 'new-drop') items = items.filter(p => p.category.includes('new-drop'));
  // else category 'all' => no filter

  if(items.length === 0){
    productGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#6b7280">Tidak ada produk.</p>`;
    return;
  }

  items.forEach(p=>{
    const card = document.createElement("article");
    card.className = "product-card";
    const badge = p.category.includes("sale") ? "SALE" : (p.category.includes("new-drop") ? "NEW" : "");
    const stok = totalStock(p);
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.name}" loading="lazy" />
      <div class="product-meta">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h3>${p.name}</h3>
          <div class="badge">${badge}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="stock">Stok: ${stok}</div>
          <div class="price">${rupiah(p.price)}</div>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-outline" data-action="view" data-id="${p.id}">Lihat</button>
        <button class="btn-primary" data-action="quickadd" data-id="${p.id}">Tambah</button>
        <button class="btn-ghost" data-action="wish" data-id="${p.id}">${ state.wishlist.includes(p.id) ? "♥" : "♡" }</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  attachProductButtons();
}

/* ========== HELPERS ========== */
function totalStock(p){ return Object.values(p.variants || {}).reduce((a,b)=>a + (Number(b)||0), 0); }

/* ========== PRODUCT ACTIONS ========== */
function attachProductButtons(){
  document.querySelectorAll('[data-action="view"]').forEach(btn=> btn.onclick = ()=> openProductModal(btn.dataset.id));
  document.querySelectorAll('[data-action="quickadd"]').forEach(btn=> btn.onclick = ()=>{
    const id = btn.dataset.id;
    const prod = state.products.find(x=>x.id===id);
    const first = Object.keys(prod.variants).find(s => prod.variants[s] > 0);
    if (!first) { toast("Stok kosong untuk produk ini."); return; }
    addToCart({ id, size: first, qty: 1 });
    toast("Produk ditambahkan ke keranjang");
  });
  document.querySelectorAll('[data-action="wish"]').forEach(btn=> btn.onclick = ()=> toggleWishlist(btn.dataset.id));
}

/* ========== PRODUCT MODAL ========== */
function openProductModal(id){
  const p = state.products.find(x=>x.id===id);
  if(!p) return;
  const sizes = Object.keys(p.variants);
  const options = sizes.map(s => `<option value="${s}" ${p.variants[s] <= 0 ? "disabled":""}>${s} ${p.variants[s]<=0?"(Habis)":""}</option>`).join("");
  modalProduct.style.display = "flex"; modalProduct.setAttribute("aria-hidden","false");
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = `
    <div style="display:flex;gap:18px;flex-wrap:wrap">
      <div style="flex:1;min-width:240px">
        <img src="${p.images[0]}" alt="${p.name}" style="width:100%;border-radius:8px" />
      </div>
      <div style="flex:1;min-width:260px">
        <h2 id="modal-title">${p.name}</h2>
        <div class="price" style="margin:8px 0">${rupiah(p.price)}</div>
        <p style="color:#6b7280">${p.description}</p>
        <label>Size
          <select id="modal-size">${options}</select>
        </label>
        <label>Jumlah
          <input id="modal-qty" type="number" min="1" value="1" style="width:100px"/>
        </label>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button id="modal-add" class="btn-primary">Tambah ke Keranjang</button>
          <button id="modal-wish" class="btn-ghost">${ state.wishlist.includes(p.id) ? "♥ Hapus Wishlist" : "♡ Wishlist" }</button>
        </div>
        <div style="margin-top:10px;color:#6b7280">Stok tersedia: <span id="modal-stock">${totalStock(p)}</span></div>
      </div>
    </div>
  `;
  document.getElementById("modal-add").onclick = ()=>{
    const size = document.getElementById("modal-size").value;
    const qty = Number(document.getElementById("modal-qty").value) || 1;
    if(!size){ toast("Pilih size terlebih dahulu"); return; }
    addToCart({ id: p.id, size, qty });
    closeModal(modalProduct);
    toast("Berhasil ditambahkan ke keranjang");
  };
  document.getElementById("modal-wish").onclick = ()=>{ toggleWishlist(p.id); closeModal(modalProduct); };
}

/* modal close handlers */
document.getElementById("close-product-modal").onclick = ()=> closeModal(modalProduct);
modalProduct.onclick = (e)=> { if (e.target === modalProduct) closeModal(modalProduct); };

/* ========== CART ========== */
function addToCart({ id, size, qty }){
  const prod = state.products.find(p=>p.id===id);
  if(!prod){ toast("Produk tidak ditemukan"); return; }
  const available = prod.variants[size] || 0;
  const existing = state.cart.find(i=>i.id===id && i.size===size);
  const currentQty = existing ? existing.qty : 0;
  if(currentQty + qty > available){ toast(`Stok ${prod.name} size ${size} tidak mencukupi (tersisa ${available - currentQty})`); return; }
  if(existing) existing.qty += qty; else state.cart.push({ id, size, qty });
  save("paws_cart", state.cart); updateCartUI();
}

function updateCartUI(){
  cartCountEl.textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  if(cartSubtotalEl) cartSubtotalEl.textContent = rupiah(subtotal());
  const ship = subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  if(cartShippingEl) cartShippingEl.textContent = rupiah(ship);
  if(cartTotalEl) cartTotalEl.textContent = rupiah(subtotal() + ship);
  save("paws_cart", state.cart);
  renderWishlistCount();
  renderCartContents();
}

function renderCartContents(){
  if(!cartContents) return;
  if(state.cart.length === 0){ cartContents.innerHTML = `<p style="padding:18px;color:#6b7280">Keranjang kosong.</p>`; return; }
  cartContents.innerHTML = "";
  state.cart.forEach(item=>{
    const p = state.products.find(x=>x.id===item.id);
    const row = document.createElement("div");
    row.style.display="flex";row.style.justifyContent="space-between";row.style.alignItems="center";row.style.padding="10px 0";
    row.innerHTML = `
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${p.images[0]}" alt="${p.name}" style="width:64px;height:64px;object-fit:cover;border-radius:8px"/>
        <div>
          <div style="font-weight:700">${p.name}</div>
          <div style="color:#6b7280;font-size:13px">Size: ${item.size}</div>
          <div style="color:#6b7280;font-size:13px">${rupiah(p.price)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn-ghost" data-action="dec" data-id="${item.id}" data-size="${item.size}">-</button>
        <div>${item.qty}</div>
        <button class="btn-ghost" data-action="inc" data-id="${item.id}" data-size="${item.size}">+</button>
        <button class="btn-ghost" data-action="del" data-id="${item.id}" data-size="${item.size}">Hapus</button>
      </div>
    `;
    cartContents.appendChild(row);
  });

  cartContents.querySelectorAll("[data-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");
      const size = btn.getAttribute("data-size");
      const idx = state.cart.findIndex(x=>x.id===id && x.size===size);
      if(idx === -1) return;
      if(action === "inc"){
        const prod = state.products.find(x=>x.id===id);
        const available = prod.variants[size] || 0;
        if(state.cart[idx].qty + 1 > available) { toast("Stok tidak cukup"); return; }
        state.cart[idx].qty++;
      } else if(action === "dec"){
        state.cart[idx].qty--;
        if(state.cart[idx].qty <= 0) state.cart.splice(idx,1);
      } else if(action === "del"){
        state.cart.splice(idx,1);
      }
      save("paws_cart", state.cart); updateCartUI();
    };
  });
}

function subtotal(){ return state.cart.reduce((sum,it)=>{ const p = state.products.find(x=>x.id===it.id); return sum + (p.price * it.qty); },0); }

/* ========== WISHLIST ========== */
function toggleWishlist(id){
  const idx = state.wishlist.indexOf(id);
  if(idx === -1) state.wishlist.push(id); else state.wishlist.splice(idx,1);
  save("paws_wishlist", state.wishlist);
  renderProducts();
  renderWishlistCount();
}
function renderWishlistCount(){ wishlistCountEl.textContent = state.wishlist.length; }

/* Wishlist modal rendering */
function openWishlistModal(){
  modalWishlist.style.display = "flex"; modalWishlist.setAttribute("aria-hidden","false");
  renderWishlistContents();
}
function renderWishlistContents(){
  if(!wishlistContents) return;
  if(state.wishlist.length === 0){
    wishlistContents.innerHTML = `<p style="color:#6b7280;padding:18px">Wishlist kosong.</p>`;
    return;
  }
  wishlistContents.innerHTML = "";
  state.wishlist.forEach(id=>{
    const p = state.products.find(x=>x.id===id);
    const row = document.createElement("div");
    row.className = "wish-row";
    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.images[0]}" alt="${p.name}">
        <div>
          <div style="font-weight:700">${p.name}</div>
          <div style="color:#6b7280;font-size:13px">${rupiah(p.price)}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn-outline" data-action="view" data-id="${p.id}">Lihat</button>
        <button class="btn-ghost" data-action="remove" data-id="${p.id}">Hapus</button>
      </div>
    `;
    wishlistContents.appendChild(row);
  });

  wishlistContents.querySelectorAll('[data-action]').forEach(btn=>{
    btn.onclick = ()=>{
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if(action === 'view') { openProductModal(id); }
      else if(action === 'remove') { const i = state.wishlist.indexOf(id); if(i !== -1) state.wishlist.splice(i,1); save("paws_wishlist", state.wishlist); renderWishlistCount(); renderWishlistContents(); renderProducts(); }
    };
  });
}

/* Wishlist modal handlers */
document.getElementById("btn-wishlist").onclick = ()=> openWishlistModal();
document.getElementById("close-wishlist-modal").onclick = ()=> closeModal(modalWishlist);
document.getElementById("btn-wishlist-clear").onclick = ()=> { if(!confirm("Kosongkan wishlist?")) return; state.wishlist = []; save("paws_wishlist", state.wishlist); renderWishlistCount(); renderWishlistContents(); renderProducts(); };
modalWishlist.onclick = (e)=> { if (e.target === modalWishlist) closeModal(modalWishlist); };

/* ========== CHECKOUT ========== */
function openCheckout(){ if(state.cart.length === 0){ toast("Keranjang kosong"); return; } modalCheckout.style.display = "flex"; modalCheckout.setAttribute("aria-hidden","false"); }
document.getElementById("close-checkout-modal").onclick = ()=> closeModal(modalCheckout);

document.getElementById("checkout-form").onsubmit = function(e){
  e.preventDefault();
  const name = document.getElementById("cf-name").value.trim();
  const address = document.getElementById("cf-address").value.trim();
  const phone = document.getElementById("cf-phone").value.trim();
  const payment = document.getElementById("cf-payment").value;
  const delivery = document.getElementById("cf-delivery").value; // Ambil nilai delivery
  
  const orderText = buildOrderText({ name, address, phone, payment });
  const encoded = encodeURIComponent(orderText);

  if(delivery === 'wa'){
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
    toast("Dialihkan ke WhatsApp...");
  } else if(delivery === 'telegram'){
    window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${encoded}`, "_blank");
    toast("Dialihkan ke Telegram...");
  } else {
    toast("Pilih metode pengiriman pesanan.");
    return;
  }
  
  // state.cart = []; save("paws_cart", state.cart); updateCartUI(); // Opsional: bersihkan keranjang setelah order
  closeModal(modalCheckout);
};

document.getElementById("btn-copy-order").onclick = function(){
  const name = document.getElementById("cf-name").value.trim();
  const address = document.getElementById("cf-address").value.trim();
  const phone = document.getElementById("cf-phone").value.trim();
  const payment = document.getElementById("cf-payment").value;
  const orderText = buildOrderText({ name, address, phone, payment });
  navigator.clipboard.writeText(orderText).then(()=>toast("Teks pesanan disalin"));
};

function buildOrderText({ name="", address="", phone="", payment="" }){
  const lines = [];
  lines.push("🛒 PESANAN - PAWS STREETWEAR 🛒"); lines.push("");
  state.cart.forEach(item=>{
    const p = state.products.find(x=>x.id===item.id);
    lines.push(`${item.qty}x ${p.name} | Size: ${item.size} | @ ${rupiah(p.price)} (subtotal: ${rupiah(p.price * item.qty)})`);
  });
  lines.push(""); lines.push(`Subtotal: ${rupiah(subtotal())}`);
  const ship = subtotal() >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  lines.push(`Ongkir: ${rupiah(ship)}`); lines.push(`TOTAL: ${rupiah(subtotal()+ship)}`); lines.push(""); lines.push("=== Data Pembeli ===");
  lines.push(`Nama: ${name}`); lines.push(`Alamat: ${address}`); lines.push(`No HP: ${phone}`); lines.push(`Metode Pembayaran: ${payment}`); lines.push(""); lines.push("Terima kasih! Mohon tunggu konfirmasi.");
  return lines.join("\n");
}

/* ========== LOGIN (SIMPLE) ========== */
const btnAccount = document.getElementById("btn-account");
const modalLoginEl = document.getElementById("modal-login");
btnAccount.onclick = ()=>{
  modalLoginEl.style.display = "flex"; modalLoginEl.setAttribute("aria-hidden","false");
  const logoutBtn = document.getElementById("btn-logout");
  logoutBtn.style.display = state.user ? "inline-block" : "none";
  if(state.user){ document.getElementById("login-email").value = state.user.email || ""; document.getElementById("login-name").value = state.user.name || ""; }
};
document.getElementById("close-login-modal").onclick = ()=> closeModal(modalLoginEl);
document.getElementById("login-form").onsubmit = function(e){
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const name = document.getElementById("login-name").value.trim();
  state.user = { email, name, loggedAt: new Date().toISOString() };
  save("paws_user", state.user);
  toast(`Welcome, ${name}!`);
  closeModal(modalLoginEl);
};
document.getElementById("btn-logout").onclick = function(){ state.user = null; save("paws_user", null); toast("Logged out"); closeModal(modalLoginEl); };

/* ========== UI EVENTS & MODALS ========== */
document.getElementById("btn-cart").onclick = ()=> { modalCart.style.display = "flex"; modalCart.setAttribute("aria-hidden","false"); renderCartContents(); };
document.getElementById("close-cart-modal").onclick = ()=> closeModal(modalCart);
modalCart.onclick = (e)=> { if (e.target === modalCart) closeModal(modalCart); };
document.getElementById("btn-checkout").onclick = ()=> { closeModal(modalCart); openCheckout(); };
document.getElementById("btn-clear-cart").onclick = ()=> { if(!confirm("Kosongkan keranjang?")) return; state.cart = []; save("paws_cart", state.cart); updateCartUI(); };

/* modal close helper */
function closeModal(m){ if(!m) return; m.style.display = "none"; m.setAttribute("aria-hidden","true"); }

/* ========== TOAST ========== */
function toast(text){ const t = document.createElement("div"); t.textContent = text; t.style.position = "fixed"; t.style.right = "18px"; t.style.bottom = "110px"; t.style.background = "var(--accent)"; t.style.color = "white"; t.style.padding = "10px 14px"; t.style.borderRadius = "10px"; t.style.boxShadow = "0 8px 30px rgba(10,122,83,0.12)"; t.style.transition = "opacity 0.3s ease"; document.body.appendChild(t); setTimeout(()=>{ t.style.opacity = 0; setTimeout(() => t.remove(), 300); },1800); }

/* ========== BOOT ========== */
function boot(){
  // initial active nav
  setActiveNav(document.getElementById("btn-newdrop"));
  showSection('collection');
  renderProducts(); updateCartUI(); renderWishlistCount();

  // Logika Banner Carousel
  renderBanner();
  attachBannerListeners();

  // ESC closes modals
  window.addEventListener("keydown", (e)=>{ if(e.key === "Escape"){ [modalProduct,modalCart,modalCheckout,modalLogin,modalWishlist].forEach(m=>m && (m.style.display="none")); }});
}

boot();

