/**
 * Perbaikan script utama:
 * 1. Menerapkan Logika Pengurangan Stok Nyata PERSISTEN (disimpan di localStorage).
 * 2. Menambahkan fitur EDIT SIZE & QUANTITY pada Keranjang (Cart Modal).
 * 3. Menambahkan Validasi format No. HP di form checkout.
 * 4. Menambahkan visual 'SOLD OUT' pada produk yang stoknya 0.
 * 5. BARU: Mengaktifkan link FAQ, Syarat & Ketentuan, dan Kontak di Footer.
 *
 * PERHATIAN: Karena tidak ada backend, persistensi stok kini menggunakan localStorage.
 * Jika pengguna menghapus localStorage mereka, stok akan kembali ke data awal.
 */

/* ========== CONFIG ========== */
const WHATSAPP_NUMBER = "6287785981177"; // GANTI NOMOR ANDA
const TELEGRAM_USERNAME = "pawsfck"; // GANTI USERNAME TELEGRAM ANDA (tanpa '@')
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FLAT = 20000;

// === DATA BARU UNTUK BANNER CAROUSEL ===
const BANNERS = [
	{ img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/BANNER%20ORI%203.jpg?raw=true", alt: "PAWS Banner - T-Shirt Collection", link: "#" },
	{ img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/BANNER%20ORI%202.JPG?raw=true", alt: "Special Promo: Free Sticker Pack", link: "#" },
	{ img: "https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/BANNER%20ORI%201.JPG?raw=true", alt: "Lookbook - Casual Outfit Idea", link: "#" }
];
// ========================================

/* ========== SAMPLE PRODUCTS (Default Data) ========== */
// Produk awal ini hanya akan digunakan jika tidak ada data 'paws_products' di localStorage.
const PRODUCTS = [
	{ id: "p1", name: "SKATEGRAFFITI WHITE", price: 150000, images: ["https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/SKATEGRAFFITI%20WHITE.jpg?raw=true"], category: ["kaos","new-drop"], description: `SPESIFIKASI PRODUK :
• Bahan Cotton Combed 20s
• Cutting Reguler Fit
• Sablon Plastisol Full Collors 18 Warna
• Detail Full Tag, RIB kerah 3.5cm
• Warna Tersedia : Putih dan Hitam
• Free 2 Stiker Eksklusif`, variants: { S: 10, M: 10, L: 10, XL: 10 } },
	{ id: "p2", name: "SKATEGRAFFITI BLACK", price: 150000, images: ["https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/SKATEGRAFFITI%20BLACK.jpg?raw=true"], category: ["kaos","sale"], description: `SPESIFIKASI PRODUK :
• Bahan Cotton Combed 20s
• Cutting Reguler Fit
• Sablon Plastisol Full Collors 18 Warna
• Detail Full Tag, RIB kerah 3.5cm
• Warna Tersedia : Putih dan Hitam
• Free 2 Stiker Eksklusif`, variants: { S: 10, M: 10, L: 10, XL: 10 } },
	{ id: "p3", name: "CLASSIC LOGO", price: 150000, images: ["https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/CLASSIC%20LOGO.jpg?raw=true"], category: ["kaos","new-drop"], description: `SPESIFIKASI PRODUK :
• Bahan Cotton Combed 20s
• Cutting Boxy Fit
• Sablon Plastisol
• Detail Full Tag, RIB kerah 3.5cm
• Warna Tersedia : Hitam
• Free 2 Stiker Eksklusif`, variants: { S: 10, M: 10, L: 10, XL: 10 } },
	{ id: "p4", name: "ARABIC LOGO", price: 150000, images: ["https://github.com/Dragonwinnn1/PAWSofficial.co.id/blob/main/ARABIC%20LOGO.PNG?raw=true"], category: ["kaos","new-drop"], description: `SPESIFIKASI PRODUK :
• Bahan Cotton Combed 20s
• Cutting Reguler Fit
• Sablon Plastisol
• Detail Full Tag, RIB kerah 3.5cm
• Warna Tersedia : Hitam
• Free 2 Stiker Eksklusif`, variants: { S: 10, M: 10, L: 10, XL: 10 } }
];

/* ========== STATE ========== */
let state = {
	products: load("paws_products") || PRODUCTS, // BARU: Muat dari localStorage
	filter: { priceMin: 0, category: "all", q: "" },
	cart: load("paws_cart") || [],
	wishlist: load("paws_wishlist") || [],
	user: load("paws_user") || null,
	currentBannerIndex: 0
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
if (document.getElementById("year-copy")) document.getElementById("year-copy").textContent = new Date().getFullYear();

// Elemen untuk Banner Carousel
const bannerContainer = document.getElementById("banner-container");
const bannerPrevBtn = document.getElementById("banner-prev");
const bannerNextBtn = document.getElementById("banner-next");


/* ========== UTILS ========== */
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key){ try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function rupiah(n){ return `Rp ${Number(n).toLocaleString("id-ID")}`; }
function totalStock(p){ return Object.values(p.variants || {}).reduce((a,b)=>a + (Number(b)||0), 0); }

// REVISI: Fungsi untuk mengurangi stok fisik dan menyimpannya secara persisten
function updatePhysicalStock(cartItems) {
	cartItems.forEach(item => {
		const prod = state.products.find(p => p.id === item.id);
		if (prod && prod.variants[item.size] !== undefined) {
			const currentStock = prod.variants[item.size];
			prod.variants[item.size] = Math.max(0, currentStock - item.qty);
		}
	});
	// Wajib: Simpan array produk yang sudah dimodifikasi ke localStorage
	save("paws_products", state.products);
}

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
	state.filter.category = "new-drop"; renderProducts();
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

// BARU: Tambahkan event listener untuk link footer
document.getElementById("link-faq").onclick = (e) => {
	e.preventDefault();
	clearActiveNav();
	showSection('faq');
};
document.getElementById("link-terms").onclick = (e) => {
	e.preventDefault();
	clearActiveNav();
	showSection('terms');
};
document.getElementById("link-contact").onclick = (e) => {
	e.preventDefault();
	clearActiveNav();
	showSection('contact');
};


/* brand logo click -> home (collection) */
document.getElementById("brand-link").onclick = (e) => { e.preventDefault(); document.getElementById("btn-newdrop").click(); };

/* Show/hide sections helper (REVISI untuk halaman statis baru) */
function showSection(name){
	const sections = document.querySelectorAll('main > section');
	const hero = document.getElementById("hero");
	
	sections.forEach(sec => {
		// Sembunyikan semua section
		sec.style.display = 'none';
	});

	// Tampilkan section yang dipilih
	document.getElementById(name).style.display = 'block';

	// Logika khusus untuk Hero (hanya muncul di section collection)
	if(hero) {
		if(name === 'collection' || name === 'hero'){
			hero.style.display = 'block';
		} else {
			hero.style.display = 'none';
		}
	}
}

/* ========== BANNER CAROUSEL LOGIC (UNCHANGED) ========== */
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

	// Tambahkan delay 5 detik
	setInterval(nextBanner, 5000);	
}


/* ========== PRODUCT RENDER (UNCHANGED LOGIC) ========== */
function renderProducts(){
	productGrid.innerHTML = "";
	let items = state.products.slice();

	if(state.filter.category === 'sale') items = items.filter(p => p.category.includes('sale'));
	else if(state.filter.category === 'new-drop') items = items.filter(p => p.category.includes('new-drop'));

	if(items.length === 0){
		productGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#6b7280">Tidak ada produk.</p>`;
		return;
	}

	items.forEach(p=>{
		const card = document.createElement("article");
		card.className = "product-card";
		const totalStok = totalStock(p);	
		const isSoldOut = totalStok <= 0;

		const badge = isSoldOut ? "SOLD OUT" : (p.category.includes("sale") ? "SALE" : (p.category.includes("new-drop") ? "NEW" : ""));

		card.innerHTML = `
			<img src="${p.images[0]}" alt="${p.name}" loading="lazy" style="${isSoldOut ? 'opacity: 0.5;' : ''}" />
			${isSoldOut ? '<div style="position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; z-index: 5;">SOLD OUT</div>' : ''}
			<div class="product-meta">
				<div style="display:flex;justify-content:space-between;align-items:center">
					<h3>${p.name}</h3>
					<div class="badge" style="background:${isSoldOut ? '#fee2e2' : ''}; color:${isSoldOut ? '#dc2626' : ''};">${badge}</div>
				</div>
				<div style="display:flex;justify-content:space-between;align-items:center">
					<div class="stock" style="color:${isSoldOut ? '#dc2626' : 'var(--muted)'};">Stok: ${totalStok}</div>
					<div class="price">${rupiah(p.price)}</div>
				</div>
			</div>
			<div class="product-actions">
				<button class="btn-outline" data-action="view" data-id="${p.id}">Lihat</button>
				<button class="btn-primary" data-action="quickadd" data-id="${p.id}" ${isSoldOut ? 'disabled' : ''}>Tambah</button>
				<button class="btn-ghost" data-action="wish" data-id="${p.id}">${ state.wishlist.includes(p.id) ? "♥" : "♡" }</button>
			</div>
		`;
		productGrid.appendChild(card);
	});

	attachProductButtons();
}


/* ========== PRODUCT ACTIONS (UNCHANGED) ========== */
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

/* ========== PRODUCT MODAL (UNCHANGED) ========== */
function openProductModal(id){
	const p = state.products.find(x=>x.id===id);
	if(!p) return;
	const sizes = Object.keys(p.variants);
	const options = sizes.map(s => `<option value="${s}" ${p.variants[s] <= 0 ? "disabled":""}>${s} ${p.variants[s]<=0?"(Habis)":""}</option>`).join("");
	modalProduct.style.display = "flex"; modalProduct.setAttribute("aria-hidden","false");
	const modalContent = document.getElementById("modal-content");
	
	const hasAvailableSize = sizes.some(s => p.variants[s] > 0);
	const disabledAddBtn = !hasAvailableSize ? 'disabled' : '';

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
					<select id="modal-size" ${!hasAvailableSize ? 'disabled' : ''}>${options}</select>
				</label>
				<label>Jumlah
					<input id="modal-qty" type="number" min="1" value="1" style="width:100px" ${!hasAvailableSize ? 'disabled' : ''}/>
				</label>
				<div style="display:flex;gap:8px;margin-top:10px">
					<button id="modal-add" class="btn-primary" ${disabledAddBtn}>Tambah ke Keranjang</button>
					<button id="modal-wish" class="btn-ghost">${ state.wishlist.includes(p.id) ? "♥ Hapus Wishlist" : "♡ Wishlist" }</button>
				</div>
				<div style="margin-top:10px;color:#6b7280">Stok tersedia: <span id="modal-stock">${totalStock(p)}</span></div>
			</div>
		</div>
	`;
	
	const sizeSelect = document.getElementById("modal-size");
	const qtyInput = document.getElementById("modal-qty");
	const modalStockEl = document.getElementById("modal-stock");

	sizeSelect.onchange = ()=>{
		const size = sizeSelect.value;
		const stock = p.variants[size] || 0;
		qtyInput.max = stock;
		modalStockEl.textContent = stock;
		qtyInput.value = 1;	
	};
	
	const initialSize = sizeSelect.value;
	if(initialSize) {
		qtyInput.max = p.variants[initialSize] || 0;
		modalStockEl.textContent = p.variants[initialSize] || 0;
	}

	document.getElementById("modal-add").onclick = ()=>{
		const size = sizeSelect.value;
		const qty = Number(qtyInput.value) || 1;
		if(!size || p.variants[size] <= 0){ toast("Pilih size yang tersedia terlebih dahulu"); return; }
		if (qty > p.variants[size]) { toast(`Jumlah melebihi stok tersedia (${p.variants[size]})`); return; }
		
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

// REVISI: Menambahkan tombol "Ubah" untuk Edit Pesanan
function renderCartContents(){
	if(!cartContents) return;
	if(state.cart.length === 0){ cartContents.innerHTML = `<p style="padding:18px;color:#6b7280">Keranjang kosong.</p>`; return; }
	cartContents.innerHTML = "";
	
	state.cart.forEach((item, index)=>{
		const p = state.products.find(x=>x.id===item.id);
		const prodStock = p.variants[item.size] || 0;
		const row = document.createElement("div");
		row.style.display="flex";row.style.justifyContent="space-between";row.style.alignItems="center";row.style.padding="10px 0";row.style.borderBottom="1px solid #f3f4f6";
		const isMax = item.qty >= prodStock;

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
				<button class="btn-ghost" data-action="dec" data-idx="${index}">-</button>
				<div>${item.qty}</div>
				<button class="btn-ghost" data-action="inc" data-idx="${index}" ${isMax ? 'disabled' : ''}>+</button>
				<button class="btn-outline" data-action="edit" data-idx="${index}">Ubah</button>
				<button class="btn-ghost" data-action="del" data-idx="${index}">Hapus</button>
			</div>
		`;
		cartContents.appendChild(row);
	});

	cartContents.querySelectorAll("[data-action]").forEach(btn=>{
		btn.onclick = ()=>{
			const action = btn.getAttribute("data-action");
			const idx = Number(btn.getAttribute("data-idx"));
			const item = state.cart[idx];
			if(!item) return;

			if(action === "inc"){
				const prod = state.products.find(x=>x.id===item.id);
				const available = prod.variants[item.size] || 0;
				if(item.qty + 1 > available) { toast("Stok tidak cukup"); return; }
				item.qty++;
			} else if(action === "dec"){
				item.qty--;
				if(item.qty <= 0) state.cart.splice(idx,1);
			} else if(action === "del"){
				state.cart.splice(idx,1);
			} else if(action === "edit"){
				openEditCartModal(idx);
				return;
			}
			save("paws_cart", state.cart); updateCartUI();
		};
	});
}

// BARU: Modal untuk Edit Item Keranjang
function openEditCartModal(index) {
	const item = state.cart[index];
	const p = state.products.find(x => x.id === item.id);
	if (!item || !p) return;

	const sizes = Object.keys(p.variants);
	const options = sizes.map(s =>	
		`<option value="${s}" ${s === item.size ? 'selected' : ''} ${p.variants[s] <= 0 && s !== item.size ? "disabled":""}>
		${s} ${p.variants[s] <= 0 && s !== item.size ? "(Habis)" : (s === item.size ? `(Stok: ${p.variants[s] + item.qty})` : `(Stok: ${p.variants[s]})`)}
		</option>`
	).join("");

	const tempModal = document.createElement('div');
	tempModal.className = 'modal';
	tempModal.id = 'modal-edit-cart';
	tempModal.setAttribute('aria-hidden', 'false');
	tempModal.style.display = 'flex';
	
	tempModal.innerHTML = `
		<div class="modal-card" style="max-width:400px">
			<button class="modal-close" onclick="closeModal(document.getElementById('modal-edit-cart'))">×</button>
			<h3>Ubah Pesanan: ${p.name}</h3>
			<div style="margin-top:15px">
				<label>Size Saat Ini: ${item.size}</label>
				<label>Size Baru
					<select id="edit-size">${options}</select>
				</label>
				<label>Jumlah (Maksimal Stok)
					<input id="edit-qty" type="number" min="1" value="${item.qty}"/>
				</label>
			</div>
			<div class="modal-actions" style="border:none">
				<button id="btn-save-edit" class="btn-primary">Simpan Perubahan</button>
			</div>
		</div>
	`;
	document.body.appendChild(tempModal);

	const sizeSelect = document.getElementById("edit-size");
	const qtyInput = document.getElementById("edit-qty");
	
	// Set initial max qty: Stok tersedia + Qty item yang sedang diubah (karena qty item ini akan dikembalikan)
	const initialMax = p.variants[item.size] + item.qty;
	qtyInput.max = initialMax;

	sizeSelect.onchange = () => {
		const newSize = sizeSelect.value;
		const currentStock = p.variants[newSize] || 0;
		
		// Jika size tidak berubah, max = stok saat ini + qty yang dipesan
		if (newSize === item.size) {
			qtyInput.max = currentStock + item.qty;
		} else {
			// Jika size berubah, max = stok yang tersedia untuk size baru
			qtyInput.max = currentStock;
		}
		qtyInput.value = Math.min(Number(qtyInput.value), qtyInput.max);
	};

	document.getElementById("btn-save-edit").onclick = () => {
		const newSize = sizeSelect.value;
		const newQty = Number(qtyInput.value);
		
		if (newQty <= 0) {
			if (confirm("Jumlah 0. Yakin ingin menghapus item ini?")) {
				state.cart.splice(index, 1);
				// Tidak perlu kembalikan stok, karena tidak ada pengurangan stok di sini.
			} else {
				return;
			}
		} else if (newSize === item.size) {
			// Hanya ubah jumlah
			item.qty = newQty;
		} else {
			// Ubah size dan jumlah
			
			// 1. Kembalikan stok item lama
			p.variants[item.size] += item.qty;	
			
			// 2. Cek ketersediaan untuk item baru
			const availableNew = p.variants[newSize];
			if (newQty > availableNew) {
				toast(`Stok size ${newSize} hanya ${availableNew}. Ubah jumlah pesanan.`);
				// Batalkan pengembalian stok agar tidak double refund
				p.variants[item.size] -= item.qty;	
				return;
			}
			
			// 3. Update keranjang dan kurangi stok size baru
			item.size = newSize;
			item.qty = newQty;
			// PENTING: Pengurangan stok (hanya jika size berubah) dilakukan setelah validasi.
			// Ini sebenarnya tidak perlu karena stok dikurangi saat checkout. 
			// Namun, untuk menjaga konsistensi state.products agar tombol + di cart modal tetap valid:
			// Kita kurangi stok size baru
			p.variants[newSize] -= newQty;

			// Jika ada item lain dengan size yang sama, gabungkan
			const otherSameSizeItemIndex = state.cart.findIndex((i, idx) => i.id === item.id && i.size === newSize && idx !== index);
			if (otherSameSizeItemIndex !== -1) {
				state.cart[otherSameSizeItemIndex].qty += newQty;
				state.cart.splice(index, 1); // Hapus item yang baru diubah (karena sudah digabung)
			}

			// Simpan perubahan stok ke localStorage (tanpa harus checkout)
			save("paws_products", state.products);
		}

		save("paws_cart", state.cart);
		updateCartUI();
		closeModal(tempModal);
		toast("Pesanan di keranjang berhasil diubah!");
	};
}


function subtotal(){ return state.cart.reduce((sum,it)=>{ const p = state.products.find(x=>x.id===it.id); return sum + (p.price * it.qty); },0); }

/* ========== WISHLIST (UNCHANGED) ========== */
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
			if(action === 'view') { closeModal(modalWishlist); openProductModal(id); }
			else if(action === 'remove') {	
				if(!confirm("Anda yakin ingin menghapus item ini dari wishlist?")) return;	
				const i = state.wishlist.indexOf(id);	
				if(i !== -1) state.wishlist.splice(i,1);	
				save("paws_wishlist", state.wishlist);	
				renderWishlistCount();	
				renderWishlistContents();	
				renderProducts();	
			}
		};
	});
}

/* Wishlist modal handlers */
document.getElementById("btn-wishlist").onclick = ()=> openWishlistModal();
document.getElementById("close-wishlist-modal").onclick = ()=> closeModal(modalWishlist);
document.getElementById("btn-wishlist-clear").onclick = ()=> {	
	if(!confirm("Anda yakin ingin mengosongkan wishlist?")) return;	
	state.wishlist = [];	
	save("paws_wishlist", state.wishlist);	
	renderWishlistCount();	
	renderWishlistContents();	
	renderProducts();	
};
modalWishlist.onclick = (e)=> { if (e.target === modalWishlist) closeModal(modalWishlist); };

/* ========== CHECKOUT (UNCHANGED) ========== */
function openCheckout(){	
	if(state.cart.length === 0){ toast("Keranjang kosong"); return; }	
	modalCheckout.style.display = "flex"; modalCheckout.setAttribute("aria-hidden","false");	

	if(state.user){
		document.getElementById("cf-name").value = state.user.name || "";
		document.getElementById("cf-phone").value = state.user.phone || "";	
	}
}
document.getElementById("close-checkout-modal").onclick = ()=> closeModal(modalCheckout);

document.getElementById("checkout-form").onsubmit = function(e){
	e.preventDefault();
	
	const name = document.getElementById("cf-name").value.trim();
	const address = document.getElementById("cf-address").value.trim();
	const phone = document.getElementById("cf-phone").value.trim();
	const payment = document.getElementById("cf-payment").value;
	const delivery = document.getElementById("cf-delivery").value;
	
	// Validasi Nomor Telepon
	const phoneRegex = /^(08|62|\+62)\d{8,15}$/;	
	if (!phoneRegex.test(phone)) {
		toast("Format Nomor HP tidak valid (gunakan 08xx atau +62xx)");
		document.getElementById("cf-phone").focus();
		return;
	}

	// Update user state dengan data kontak terbaru
	if(state.user) {
		state.user.phone = phone;
		state.user.name = name;
		save("paws_user", state.user);
	}
	
	// Salin keranjang sebelum dikosongkan untuk update stok dan pesan order
	const itemsToReduceStock = JSON.parse(JSON.stringify(state.cart));

	const orderText = buildOrderText({ name, address, phone, payment });
	const encoded = encodeURIComponent(orderText);

	let success = false;
	if(delivery === 'wa'){
		window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, "_blank");
		toast("Dialihkan ke WhatsApp...");
		success = true;
	} else if(delivery === 'telegram'){
		window.open(`https://t.me/${TELEGRAM_USERNAME}?text=${encoded}`, "_blank");
		toast("Dialihkan ke Telegram...");
		success = true;
	} else {
		toast("Pilih metode pengiriman pesanan.");
		return;
	}
	
	if (success) {
		// 1. Update Stok Fisik & Simpan Permanen ke localStorage
		updatePhysicalStock(itemsToReduceStock);
		
		// 2. Kosongkan Keranjang
		state.cart = [];	
		save("paws_cart", state.cart);	
		
		// 3. Perbarui UI
		updateCartUI();	
		renderProducts(); // Wajib dipanggil untuk update tampilan stok di grid
		
		closeModal(modalCheckout);
	}
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
	lines.push(`Ongkir: ${rupiah(ship)}`);	
	lines.push(`TOTAL: ${rupiah(subtotal()+ship)}`);	
	lines.push("");	
	lines.push("=== Data Pembeli ===");
	lines.push(`Nama: ${name}`);	
	lines.push(`Alamat: ${address}`);	
	lines.push(`No HP: ${phone}`);	
	lines.push(`Metode Pembayaran: ${payment}`);	
	lines.push("");	
	lines.push("Terima kasih! Mohon tunggu konfirmasi.");
	return lines.join("\n");
}

/* ========== LOGIN (SIMPLE) (UNCHANGED) ========== */
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
	
	state.user = { email, name, loggedAt: new Date().toISOString(), phone: state.user ? state.user.phone : '' };	
	
	save("paws_user", state.user);
	toast(`Welcome, ${name}!`);
	closeModal(modalLoginEl);
};
document.getElementById("btn-logout").onclick = function(){	
	if(!confirm("Anda yakin ingin logout?")) return;
	state.user = null;	
	save("paws_user", null);	
	toast("Logged out");	
	closeModal(modalLoginEl);	
};

/* ========== UI EVENTS & MODALS (LENGKAP) ========== */
document.getElementById("btn-cart").onclick = ()=> { 
    modalCart.style.display = "flex"; 
    modalCart.setAttribute("aria-hidden","false"); 
    renderCartContents(); 
};
document.getElementById("close-cart-modal").onclick = ()=> closeModal(modalCart);
modalCart.onclick = (e)=> { if (e.target === modalCart) closeModal(modalCart); };
document.getElementById("btn-checkout").onclick = ()=> { closeModal(modalCart); openCheckout(); };

// BARU: Tambahkan handler untuk Pop-up Banner (jika ada)
// Anda dapat mengaktifkan ini jika ingin pop-up banner muncul secara otomatis
/*
document.addEventListener('DOMContentLoaded', () => { setTimeout(openPopupBanner, 2000); });
*/

function openPopupBanner(){
    const modal = document.getElementById('modal-popup');
    if(modal) {
        modal.style.display = "flex"; 
        modal.setAttribute("aria-hidden","false");
    }
}
const modalPopup = document.getElementById('modal-popup');
if(modalPopup) {
    document.getElementById("close-popup-modal").onclick = ()=> closeModal(modalPopup);
    modalPopup.onclick = (e)=> { if (e.target === modalPopup) closeModal(modalPopup); };
}


/* ========== GLOBAL MODAL & TOAST ========== */
function closeModal(modalEl){
  modalEl.style.display = "none";
  modalEl.setAttribute("aria-hidden","true");
  // Hapus modal edit cart sementara jika masih ada
  const tempModal = document.getElementById('modal-edit-cart');
  if(tempModal) tempModal.remove();
}

/* ========== TOAST ========== */
function toast(text){
    const t = document.createElement("div"); 
    t.textContent = text; 
    t.style.position = "fixed"; 
    t.style.right = "20px"; 
    t.style.bottom = "110px"; 
    t.style.background = "var(--accent)"; 
    t.style.color = "white"; 
    t.style.padding = "10px 14px"; 
    t.style.borderRadius = "10px"; 
    t.style.boxShadow = "0 8px 30px rgba(10,122,83,0.12)"; 
    t.style.transition = "opacity 0.3s ease, transform 0.3s ease"; 
    t.style.transform = "translateY(100px)"; 
    t.style.zIndex = 100000; /* Pastikan di atas semua modal */
    document.body.appendChild(t); 
    setTimeout(()=>{ t.style.transform = "translateY(0)"; },10); 
    setTimeout(()=>{ t.style.opacity = 0; setTimeout(() => t.remove(), 300); },2000); 
}

/* ========== BOOT (FINAL) ========== */
function boot(){
  // Jika tidak ada data produk di localStorage, simpan data default awal
  if(!load("paws_products")){
    save("paws_products", PRODUCTS);
    state.products = PRODUCTS;
  }

  // initial active nav
  document.getElementById("btn-newdrop").click(); // Trigger klik untuk load produk & set nav
  updateCartUI(); 
  attachBannerListeners();
  renderBanner();
}

// Mulai aplikasi setelah DOM siap
document.addEventListener("DOMContentLoaded", boot);
