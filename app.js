// ==========================================
// app.js (UPDATED: 4 New Cakes Added)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// ==========================================
// 🎂 CAKE DATA (Updated with 4 new options)
// ==========================================
const cakes = [
  // New Cakes
  {
    id: "pistachio",
    name: "Pistachio Dream",
    category: "Special",
    desc: "Light pistachio sponge, nutty cream, and rose petal decoration.",
    price: 2400,
    tag: "NEW FAVOURITE",
    img: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "lotus",
    name: "Lotus Biscoff Bliss",
    category: "Special",
    desc: "Spiced sponge layered with creamy Biscoff spread and crushed cookies.",
    price: 2600,
    tag: "SIGNATURE",
    img: "https://images.unsplash.com/photo-1627814041767-f3775b1182fb?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "mango",
    name: "Mango Sunshine",
    category: "Fruit",
    desc: "Vanilla cake with fresh mango coulis and white chocolate flakes.",
    price: 2100,
    tag: "SEASONAL",
    img: "https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "hazelnut",
    name: "Chocolate Hazelnut Truffle",
    category: "Chocolate",
    desc: "Decadent dark chocolate sponge filled with smooth hazelnut ganache.",
    price: 2800,
    tag: "PREMIUM CHOCOLATE",
    img: "https://images.unsplash.com/photo-1596701062351-8c0c16999a4e?q=80&w=800&auto=format&fit=crop"
  },

  // Existing Cakes
  {
    id: "velvet",
    name: "Velvet Romance",
    category: "Classic",
    desc: "Soft red velvet layers with smooth cream cheese frosting.",
    price: 1700,
    tag: "BESTSELLER",
    img: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "chocolate",
    name: "Midnight Chocolate",
    category: "Chocolate",
    desc: "Rich chocolate sponge with silky chocolate ganache.",
    price: 1800,
    tag: "CHOCOLATE LOVER",
    img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "strawberry",
    name: "Strawberry Dream",
    category: "Fruit",
    desc: "Vanilla sponge, fresh strawberry flavour and creamy frosting.",
    price: 1900,
    tag: "FRESH FAVOURITE",
    img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "vanilla",
    name: "Classic Vanilla",
    category: "Classic",
    desc: "A timeless vanilla cake with a light, buttery finish.",
    price: 1500,
    tag: "TIMELESS",
    img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "drip",
    name: "Chocolate Drip",
    category: "Chocolate",
    desc: "Chocolate cake finished with a glossy drip and sprinkles.",
    price: 2100,
    tag: "PARTY PICK",
    img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "berry",
    name: "Berry Bliss",
    category: "Fruit",
    desc: "A celebration cake with berry-inspired flavours and cream.",
    price: 2200,
    tag: "FRUITY",
    img: "https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "caramel",
    name: "Caramel Cloud",
    category: "Classic",
    desc: "Soft cake with caramel notes and a creamy finish.",
    price: 1900,
    tag: "CUSTOMER LOVE",
    img: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?auto=format&fit=crop&w=800&q=82"
  },
  {
    id: "blackforest",
    name: "Black Forest",
    category: "Chocolate",
    desc: "Chocolate layers with cherry-inspired flavour and cream.",
    price: 2000,
    tag: "CELEBRATION",
    img: "https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&w=800&q=82"
  }
];

const sizes = [{label:"½ pound",factor:.55},{label:"1 pound",factor:1},{label:"1.5 pounds",factor:1.45},{label:"2 pounds",factor:1.9},{label:"3 pounds",factor:2.75}];
const toppings = [{name:"Extra chocolate ganache",price:250},{name:"Fresh strawberries",price:300},{name:"Chocolate chips",price:150},{name:"Sprinkles",price:100},{name:"Extra cream",price:150},{name:"Custom topper",price:250}];

let auth, db, currentUser=null, cart=[], activeFilter="All", selectedCake=null, toastTimer;

// Standard fallback image URL
const DEFAULT_CAKE_IMAGE = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80";

// Standard onerror handler function
const handleImageError = `onerror="this.onerror=null;this.src='${DEFAULT_CAKE_IMAGE}';"`;

const $=s=>document.querySelector(s);
const modalLayer=$("#modalLayer"), modal=$("#modalContent");
const money=n=>"Rs. "+Math.round(n).toLocaleString("en-PK");

const configReady=()=>firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_") && firebaseConfig.projectId && !firebaseConfig.projectId.includes("YOUR_");

try { if(configReady()){const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);onAuthStateChanged(auth,u=>{currentUser=u;$("#accountBtn").textContent=u?(u.displayName||"My account"):"Log in";});} }
catch(e){console.error("Firebase setup error:",e);}

function toast(msg){const el=$("#toast");el.textContent=msg;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),3200);}
function showModal(html,wide=false){modal.innerHTML=html;modal.classList.toggle("wide",wide);modalLayer.classList.remove("hidden");document.body.style.overflow="hidden";}
function closeModal(){modalLayer.classList.add("hidden");document.body.style.overflow="";}
modalLayer.addEventListener("click",e=>{if(e.target===modalLayer)closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});

function renderCakes(){
 const filtered=cakes.filter(c=>activeFilter==="All"||c.category===activeFilter);
 $("#cakeGrid").innerHTML=filtered.map(c=>`<article class="cake-card"><div class="cake-photo-wrap"><img class="cake-photo" src="${c.img}" alt="${c.name}" loading="lazy" ${handleImageError}><span class="cake-tag">${c.tag}</span></div><div class="cake-info"><h3>${c.name}</h3><p>${c.desc}</p><div class="cake-bottom"><span class="cake-price">From ${money(c.price)}</span><button class="add-btn" data-cake="${c.id}" aria-label="Customize ${c.name}">+</button></div></div></article>`).join("");
}
renderCakes();
$("#filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderCakes();});
$("#cakeGrid").addEventListener("click",e=>{const b=e.target.closest("[data-cake]");if(b)openCake(b.dataset.cake);});

function openCake(id){
 selectedCake=cakes.find(c=>c.id===id);if(!selectedCake)return;
 showModal(`<div class="modal-head"><div><span class="eyebrow">MAKE IT YOURS</span><h2 id="modalTitle">${selectedCake.name}</h2><div class="modal-sub">${selectedCake.desc}</div></div><button class="close-btn" data-close aria-label="Close">×</button></div>
 <img class="product-preview" src="${selectedCake.img}" alt="${selectedCake.name}" ${handleImageError}>
 <form id="customizeForm">
  <div class="field"><label for="cakeSize">Choose cake size</label><select id="cakeSize" required>${sizes.map(s=>`<option value="${s.label}" data-factor="${s.factor}" ${s.label==="1 pound"?"selected":""}>${s.label} — ${money(selectedCake.price*s.factor)}</option>`).join("")}</select></div>
  <div class="field"><label>Extra toppings (optional)</label><div class="choice-row">${toppings.map((t,i)=>`<label class="choice"><input type="checkbox" name="topping" value="${i}"> ${t.name} (+${money(t.price)})</label>`).join("")}</div></div>
  <div class="form-grid"><div class="field"><label for="cakeQty">Quantity</label><input id="cakeQty" type="number" min="1" max="20" value="1" required></div><div class="field"><label for="cakeMessage">Message on cake</label><input id="cakeMessage" maxlength="70" placeholder="e.g. Happy Birthday Ali"></div></div>
  <div class="field"><label for="cakeInstructions">Special instructions</label><textarea id="cakeInstructions" maxlength="500" placeholder="Colours, design, delivery notes, allergies, etc."></textarea></div>
  <div class="price-line"><span>Item total</span><strong id="customTotal">${money(selectedCake.price)}</strong></div>
  <div class="modal-actions"><button type="button" class="secondary-action" data-close>Cancel</button><button class="primary-action" type="submit">Add to bag</button></div>
 </form>`,true);
 const form=$("#customizeForm"), size=$("#cakeSize"), qty=$("#cakeQty");
 function calc(){const factor=Number(size.selectedOptions[0].dataset.factor);const extras=[...form.querySelectorAll('input[name="topping"]:checked')].reduce((n,x)=>n+toppings[Number(x.value)].price,0);$("#customTotal").textContent=money((selectedCake.price*factor+extras)*Math.max(1,Number(qty.value)||1));}
 form.addEventListener("change",calc);qty.addEventListener("input",calc);
 form.addEventListener("submit",e=>{e.preventDefault();const factor=Number(size.selectedOptions[0].dataset.factor),top=[...form.querySelectorAll('input[name="topping"]:checked')].map(x=>toppings[Number(x.value)]);const count=Math.max(1,Math.min(20,Number(qty.value)||1));const unit=Math.round(selectedCake.price*factor+top.reduce((n,t)=>n+t.price,0));cart.push({lineId:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),cakeId:selectedCake.id,name:selectedCake.name,img:selectedCake.img,size:size.value,toppings:top.map(t=>t.name),message:$("#cakeMessage").value.trim(),instructions:$("#cakeInstructions").value.trim(),qty:count,unit,total:unit*count});updateCartCount();closeModal();toast("Added to your bag ♡");});
}
function updateCartCount(){$("#cartCount").textContent=cart.reduce((n,x)=>n+x.qty,0);}
$("#modalContent").addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeModal();});

$("#cartBtn").addEventListener("click",openCart);
function cartTotal(){return cart.reduce((n,x)=>n+x.total,0);}
function openCart(){
 showModal(`<div class="modal-head"><div><span class="eyebrow">YOUR SWEET PICKS</span><h2 id="modalTitle">Your bag</h2><div class="modal-sub">Check your cakes before placing your order.</div></div><button class="close-btn" data-close>×</button></div>
 <div id="cartContents"></div>`,true);
 renderCartContents();
}
function renderCartContents(){
 const el=$("#cartContents");if(!el)return;
 if(!cart.length){el.innerHTML='<div class="empty-state">Your bag is waiting for something sweet. ♡</div><div class="modal-actions"><button class="primary-action" data-close>Explore cakes</button></div>';return;}
 el.innerHTML=cart.map((x,i)=>`<div class="cart-line"><img src="${x.img}" alt="" ${handleImageError}><div><b>${x.name} · ${x.size}</b><small>Qty ${x.qty} · ${x.toppings.length?x.toppings.join(", "):"No extra toppings"}${x.message?`<br>Message: ${escapeHtml(x.message)}`:""}<br>${money(x.total)}</small><button class="remove-btn" data-remove="${i}">Remove</button></div><b>${money(x.total)}</b></div>`).join("")+`<div class="cart-total"><span>Total</span><span>${money(cartTotal())}</span></div><div class="modal-actions"><button class="secondary-action" data-close>Keep shopping</button><button id="checkoutBtn" class="primary-action">Continue to checkout</button></div>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
$("#modalContent").addEventListener("click",e=>{const rm=e.target.closest("[data-remove]");if(rm){cart.splice(Number(rm.dataset.remove),1);updateCartCount();renderCartContents();}if(e.target.closest("#checkoutBtn"))startCheckout();});

function firebaseNeeded(){if(!configReady()||!auth||!db){toast("Firebase is not configured yet. Add your Firebase web config first.");return false;}return true;}
$("#accountBtn").addEventListener("click",()=>{if(currentUser)showAccount();else showAuth();});
function showAuth(mode="login",notice=""){
 if(!configReady()){showModal(`<div class="modal-head"><div><span class="eyebrow">ACCOUNT</span><h2 id="modalTitle">Connect Firebase first</h2></div><button class="close-btn" data-close>×</button></div><p class="modal-sub">The website is ready to connect, but Firebase configuration has not been added. Follow the README steps and paste your web app config into <b>firebase-config.js</b>.</p><div class="error-note">Until Firebase is configured, sign-in, checkout, saved orders, and email automation will not work.</div><div class="modal-actions"><button class="primary-action" data-close>Got it</button></div>`);return;}
 showModal(`<div class="modal-head"><div><span class="eyebrow">WELCOME TO SWEET CAKES</span><h2 id="modalTitle">${mode==="login"?"Welcome back.":"Create your account."}</h2><div class="modal-sub">Sign in to place orders and receive order updates.</div></div><button class="close-btn" data-close>×</button></div>${notice?`<div class="error-note">${escapeHtml(notice)}</div>`:""}<form id="authForm">${mode==="signup"?'<div class="field"><label for="authName">Full name</label><input id="authName" required maxlength="80" autocomplete="name"></div>':""}<div class="field"><label for="authEmail">Email address</label><input id="authEmail" type="email" required autocomplete="email"></div><div class="field"><label for="authPassword">Password</label><input id="authPassword" type="password" required minlength="6" autocomplete="${mode==="login"?"current-password":"new-password"}"></div><button class="primary-action" type="submit" style="width:100%">${mode==="login"?"Log in":"Create account"}</button></form><p class="modal-sub" style="margin-top:16px">${mode==="login"?'New here? <button id="switchAuth" class="text-btn">Create an account</button>':'Already have an account? <button id="switchAuth" class="text-btn">Log in</button>'}</p>`);
 $("#switchAuth").addEventListener("click",()=>showAuth(mode==="login"?"signup":"login"));
 $("#authForm").addEventListener("submit",async e=>{e.preventDefault();if(!firebaseNeeded())return;const btn=e.currentTarget.querySelector("button[type=submit]");btn.disabled=true;try{const email=$("#authEmail").value.trim(),password=$("#authPassword").value;let cred;if(mode==="signup"){cred=await createUserWithEmailAndPassword(auth,email,password);await updateProfile(cred.user,{displayName:$("#authName").value.trim()});currentUser=cred.user;toast("Account created successfully.");}else{cred=await signInWithEmailAndPassword(auth,email,password);currentUser=cred.user;toast("You are logged in.");}closeModal();$("#accountBtn").textContent=currentUser.displayName||"My account";if(cart.length)startCheckout();}catch(err){showAuth(mode,authError(err.code));}finally{btn.disabled=false;}});
}
function authError(code){return ({ "auth/email-already-in-use":"This email already has an account. Try logging in.","auth/invalid-credential":"Email or password is incorrect.","auth/weak-password":"Use a password with at least 6 characters.","auth/invalid-email":"Please enter a valid email address.","auth/too-many-requests":"Too many attempts. Please try again later.","auth/network-request-failed":"Network error. Check your internet connection."})[code]||"Could not complete this action. Check the details and try again.";}
function showAccount(){showModal(`<div class="modal-head"><div><span class="eyebrow">YOUR ACCOUNT</span><h2 id="modalTitle">Hello, ${escapeHtml(currentUser.displayName||"there")}.</h2><div class="modal-sub">${escapeHtml(currentUser.email||"")}</div></div><button class="close-btn" data-close>×</button></div><p class="modal-sub">Order updates will be sent to this email address. Please use an email you can access.</p><div class="modal-actions"><button id="historyBtn" class="secondary-action">My orders</button><button id="logoutBtn" class="primary-action">Log out</button></div>`);$("#logoutBtn").addEventListener("click",async()=>{await signOut(auth);currentUser=null;closeModal();toast("You have logged out.");});$("#historyBtn").addEventListener("click",showOrderHistory);}

function startCheckout(){
 if(!cart.length){toast("Add a cake to your bag first.");return;}
 if(!currentUser){showAuth("login","Please log in or create an account to place your order.");return;}
 if(!firebaseNeeded())return;
 showModal(`<div class="modal-head"><div><span class="eyebrow">ALMOST THERE</span><h2 id="modalTitle">Checkout</h2><div class="modal-sub">Add your delivery details. We’ll email order updates to ${escapeHtml(currentUser.email||"your account email")}.</div></div><button class="close-btn" data-close>×</button></div>
 <form id="checkoutForm"><div class="form-grid"><div class="field"><label for="custName">Full name *</label><input id="custName" required maxlength="100" autocomplete="name" value="${escapeHtml(currentUser.displayName||"")}"></div><div class="field"><label for="custPhone">Mobile number *</label><input id="custPhone" required type="tel" maxlength="25" placeholder="+92 3XX XXXXXXX" autocomplete="tel"></div><div class="field full"><label for="custAddress">Delivery address *</label><textarea id="custAddress" required maxlength="500" autocomplete="street-address" placeholder="House, street, area, city"></textarea></div><div class="field"><label for="deliveryDate">Preferred date</label><input id="deliveryDate" type="date" min="${new Date().toISOString().slice(0,10)}"></div><div class="field"><label for="paymentMethod">Payment method *</label><select id="paymentMethod" required><option value="Cash on Delivery">Cash on Delivery</option><option value="Cash">Cash (pickup/in person)</option><option value="EasyPaisa">EasyPaisa (confirm details separately)</option><option value="JazzCash">JazzCash (confirm details separately)</option></select></div></div>
 <div class="price-line"><span>Order total</span><strong>${money(cartTotal())}</strong></div><div class="modal-sub">EasyPaisa and JazzCash are payment preferences only; this website does not process digital payments automatically.</div><div class="modal-actions"><button type="button" class="secondary-action" data-close>Back</button><button id="placeOrderBtn" class="primary-action" type="submit">Confirm order</button></div></form>`,true);
 $("#checkoutForm").addEventListener("submit",placeOrder);
}
async function placeOrder(e){
 e.preventDefault();if(!currentUser||!firebaseNeeded())return;
 const btn=$("#placeOrderBtn");btn.disabled=true;btn.textContent="Placing order…";
 const orderItems=cart.map(({cakeId,name,size,toppings,message,instructions,qty,unit,total})=>({cakeId,name,size,toppings,message,instructions,qty,unitPrice:unit,lineTotal:total}));
 const order={customerUid:currentUser.uid,customerName:$("#custName").value.trim(),customerEmail:currentUser.email,customerPhone:$("#custPhone").value.trim(),deliveryAddress:$("#custAddress").value.trim(),preferredDate:$("#deliveryDate").value||null,paymentMethod:$("#paymentMethod").value,items:orderItems,total:cartTotal(),currency:"PKR",status:"pending",createdAt:serverTimestamp(),source:"sweet-cakes-website"};
 try{const ref=await addDoc(collection(db,"orders"),order);cart=[];updateCartCount();closeModal();showModal(`<div class="modal-head"><div><span class="eyebrow">ORDER RECEIVED</span><h2 id="modalTitle">Thank you, ${escapeHtml(order.customerName.split(" ")[0])}! ♡</h2></div><button class="close-btn" data-close>×</button></div><div class="status-note">Your order has been saved. Order reference: <b>${escapeHtml(ref.id)}</b><br>We’ll send your confirmation email and notify the bakery through its configured WhatsApp Business integration.</div><p class="modal-sub">Please keep your phone available in case we need to confirm any details. Your order status will be updated by the bakery.</p><div class="modal-actions"><button class="primary-action" data-close>Back to cakes</button></div>`); }
 catch(err){console.error(err);toast("Order could not be saved. Please check your Firebase setup and try again.");btn.disabled=false;btn.textContent="Confirm order";}
}
async function showOrderHistory(){
 if(!currentUser||!firebaseNeeded())return;
 showModal(`<div class="modal-head"><div><span class="eyebrow">YOUR SWEET MOMENTS</span><h2 id="modalTitle">My orders</h2></div><button class="close-btn" data-close>×</button></div><div class="empty-state">Loading your orders…</div>`,true);
 try{
  // Simple read for demo only - index-free. Restrict reads in production rules.
  const {query,where,getDocs}=await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
  const snap=await getDocs(query(collection(db,"orders"),where("customerUid","==",currentUser.uid)));
  const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  $("#modalContent").innerHTML=`<div class="modal-head"><div><span class="eyebrow">YOUR SWEET MOMENTS</span><h2 id="modalTitle">My orders</h2></div><button class="close-btn" data-close>×</button></div>${rows.length?rows.map(o=>`<div class="cart-line"><div class="brand-mark">♡</div><div><b>Order ${escapeHtml(o.id.slice(0,8))}</b><small>${(o.items||[]).map(i=>`${escapeHtml(i.name)} (${escapeHtml(i.size)}) × ${i.qty}`).join("<br>")}<br>Status: <strong>${escapeHtml(o.status||"pending")}</strong></small></div><b>${money(o.total||0)}</b></div>`).join(""):'<div class="empty-state">No orders yet. Your first sweet order is waiting.</div>'}`;
 }catch(err){console.error(err);$("#modalContent").innerHTML='<div class="modal-head"><h2 id="modalTitle">My orders</h2><button class="close-btn" data-close>×</button></div><div class="error-note">Could not load orders. Check Firestore rules and setup.</div>';}
}

$("#accountBtn").title="Log in or view your account";