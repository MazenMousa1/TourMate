const guides = [
  { id: 1, name: "Elena", city: "Athens", country: "Greece", rating: "5.0", reviews: 124, price: 72, tags: ["History", "Culture", "City tours"], photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=85", bio: "I grew up among Athens' old streets and love turning myths, food and everyday city life into warm, memorable walks." },
  { id: 2, name: "Marco", city: "Amalfi Coast", country: "Italy", rating: "4.9", reviews: 98, price: 85, tags: ["Food & drink", "Nature", "Local life"], photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=85", bio: "I'm Marco, a local guide, food lover and nature enthusiast. I love sharing the history, flavours and hidden spots of my home." },
  { id: 3, name: "Sari", city: "Bali", country: "Indonesia", rating: "5.0", reviews: 87, price: 64, tags: ["Nature", "Culture", "Wellness"], photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=85", bio: "Discover quiet temples, family traditions and tropical paths with someone who has called Bali home her whole life." },
  { id: 4, name: "Daniel", city: "Lisbon", country: "Portugal", rating: "4.8", reviews: 73, price: 68, tags: ["City tours", "Food & drink", "History"], photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=85", bio: "Come hear Lisbon's stories, taste its best bites and find the viewpoints that most visitors walk right past." }
];

const starterTours = [
  { id: 1, title: "Athens after sunset", destination: "Athens, Greece", guideId: 1, date: "2026-10-18", price: 38, capacity: 12, image: "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=900&q=85", description: "Ancient lanes, rooftop views and local stories at golden hour." },
  { id: 2, title: "Flavours of the coast", destination: "Amalfi Coast, Italy", guideId: 2, date: "2026-10-24", price: 54, capacity: 8, image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=85", description: "Taste the coast together, from family kitchens to sea views." },
  { id: 3, title: "Bali's quiet side", destination: "Bali, Indonesia", guideId: 3, date: "2026-11-02", price: 42, capacity: 10, image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85", description: "Temples, rice terraces and a slower way to explore." }
];

const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" }) : "Date to be arranged";
const today = () => new Date().toISOString().slice(0, 10);

const state = {
  user: load("tourmate-user", null),
  accounts: load("tourmate-accounts", []),
  bookings: load("tourmate-bookings", []),
  tours: load("tourmate-tours", starterTours),
  messages: load("tourmate-messages", []),
  reviews: load("tourmate-reviews", []),
  saved: load("tourmate-saved", []),
  guideProfile: load("tourmate-guide-profile", { name: "Your guide profile", city: "", bio: "", price: 80 }),
  category: "All", bookingTab: "upcoming", conversation: 2, conversationTourist: "", selectedGuide: 2, pendingBooking: null
};

function allGuides() {
  const p = state.guideProfile;
  if (!p.city || !p.bio) return guides;
  const [city, ...country] = p.city.split(",").map(part => part.trim());
  return [...guides, { id: 5, name: p.name, city, country: country.join(", ") || "Local", rating: "New", reviews: 0, price: p.price, tags: ["Local life", "City tours"], bio: p.bio, verified: false, portrait: 2 }];
}

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const modal = $("#modalBackdrop");
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function showModal(html) {
  $("#modalContent").innerHTML = `<button class="modal-close" data-close aria-label="Close dialog">×</button>${html}`;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  $("#modalContent input:not([type=hidden]), #modalContent button:not(.modal-close)")?.focus();
}
function closeModal() { modal.hidden = true; document.body.classList.remove("modal-open"); }

function requireLogin(next) {
  if (state.user) return true;
  showAuth("login", next);
  return false;
}

function updateAccount() {
  $("#loginButton").hidden = !!state.user;
  $("#signupButton").hidden = !!state.user;
  $("#accountButton").hidden = !state.user;
  $("#accountButton").textContent = state.user ? `Hi, ${state.user.name.split(" ")[0]}` : "My account";
}

function showAuth(mode = "login", next = "") {
  const signup = mode === "signup";
  showModal(`<p class="eyebrow">Your next adventure starts here</p><h2>${signup ? "Create an account" : "Welcome back"}</h2><p class="modal-copy">${signup ? "Join as a traveller or a local guide." : "Sign in to manage your trips and messages."}</p>
    <form id="authForm" class="form-stack" data-mode="${mode}" data-next="${escapeHtml(next)}">
      ${signup ? `<label>Name<input name="name" placeholder="Your name" required></label><label>I am a<select name="role"><option value="tourist" ${next !== "dashboard" ? "selected" : ""}>Traveller</option><option value="guide" ${next === "dashboard" ? "selected" : ""}>Local guide</option></select></label>` : ""}
      <label>Email<input name="email" type="email" placeholder="you@example.com" required></label>
      <label>Password<input name="password" type="password" minlength="6" placeholder="At least 6 characters" required></label>
      <button class="primary-button" type="submit">${signup ? "Create account" : "Log in"}</button>
    </form>
    <p class="switch-auth">${signup ? "Already have an account?" : "New to TourMate?"} <button data-auth="${signup ? "login" : "signup"}" data-next="${escapeHtml(next)}">${signup ? "Log in" : "Sign up"}</button></p>
    <p class="demo-note">UI demo: your information is saved only in this browser.</p>`);
}

function openView(name) {
  const route = ["home", "explore", "profile", "groups", "bookings", "messages", "dashboard"].includes(name) ? name : "home";
  $$("[data-view]").forEach(view => view.classList.toggle("active", view.id === route));
  const tab = ({ profile: "explore", groups: "explore", dashboard: "me" })[route] || route;
  $$("[data-tab]").forEach(button => { const active = button.dataset.tab === tab; button.classList.toggle("active", active); if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  $("#mobileMenu").classList.remove("open");
  $("#menuButton").setAttribute("aria-expanded", "false");
  if (route === "profile") renderProfile(state.selectedGuide);
  if (route === "explore") renderGuides();
  if (route === "groups") renderGroups();
  if (route === "bookings") renderBookings();
  if (route === "messages") renderMessages();
  if (route === "dashboard") renderDashboard();
  if (["about", "experiences"].includes(name)) requestAnimationFrame(() => document.getElementById(name)?.scrollIntoView({ behavior: "smooth" }));
  else window.scrollTo({ top: 0, behavior: "smooth" });
  revealVisible();
}

function navigate(name) { if (location.hash === `#${name}`) openView(name); else location.hash = name; }

function revealVisible() {
  requestAnimationFrame(() => $$(".view.active .reveal").forEach((item, index) => setTimeout(() => item.classList.add("visible"), Math.min(index * 45, 260))));
}

function guideCard(guide) {
  const saved = state.saved.includes(guide.id);
  return `<article class="guide-card reveal" data-guide="${guide.id}" tabindex="0" role="link" aria-label="Open ${guide.name}'s profile">
    <div class="guide-photo"><div class="portrait portrait-${guide.portrait || guide.id}" role="img" aria-label="${escapeHtml(guide.name)}, local guide in ${escapeHtml(guide.city)}"></div><button class="heart ${saved ? "saved" : ""}" aria-label="${saved ? "Remove" : "Save"} ${escapeHtml(guide.name)}" data-save="${guide.id}">${saved ? "♥" : "♡"}</button>${guide.verified === false ? "" : '<span class="verified">✓ Verified guide</span>'}</div>
    <div class="guide-info"><div class="guide-name-row"><h2>${escapeHtml(guide.name)}</h2><span class="rating">${guide.reviews ? `<span class="stars">★</span> ${guide.rating} (${guide.reviews})` : "New guide"}</span></div><p class="location">⌖ ${escapeHtml(guide.city)}, ${escapeHtml(guide.country)}</p><div class="tag-list">${guide.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div></div>
  </article>`;
}

function renderGuides() {
  const query = $("#placeFilter").value.trim().toLowerCase();
  const shown = allGuides().filter(guide => (!query || `${guide.city} ${guide.country}`.toLowerCase().includes(query)) && (state.category === "All" || guide.tags.includes(state.category)));
  $("#guideGrid").innerHTML = shown.map(guideCard).join("");
  $("#resultCount").textContent = `${shown.length} local ${shown.length === 1 ? "guide" : "guides"} ready to show you around`;
  $("#emptyState").hidden = shown.length > 0;
  renderExploreTours(query);
  revealVisible();
}

function renderProfile(id) {
  const guide = allGuides().find(item => item.id === Number(id)) || guides[1];
  state.selectedGuide = guide.id;
  const guideReviews = state.reviews.filter(review => review.guideId === guide.id);
  $("#profileContent").innerHTML = `<div class="profile-main">
    <div class="profile-image portrait portrait-${guide.portrait || guide.id}" role="img" aria-label="${escapeHtml(guide.name)}"></div>
    <div class="profile-details"><div class="profile-title"><h1>${escapeHtml(guide.name)}</h1>${guide.verified === false ? "" : '<span class="verified inline-verified">✓ Verified guide</span>'}</div>
      <div class="rating">${guide.reviews ? `<span class="stars">★★★★★</span> ${guide.rating} (${guide.reviews} reviews)` : "New guide"}</div><p class="location">⌖ ${escapeHtml(guide.city)}, ${escapeHtml(guide.country)}</p>
      <p class="profile-bio">${escapeHtml(guide.bio)}</p><div class="tag-list">${guide.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="profile-points"><div><span>♙</span><p><b>Small groups</b><small>More personal experiences</small></p></div><div><span>♧</span><p><b>Custom itineraries</b><small>Tailored to your interests</small></p></div><div><span>♡</span><p><b>Local impact</b><small>Supporting local businesses</small></p></div></div>
      <button class="outline-button message-guide" data-message-guide="${guide.id}">Message ${guide.name}</button>
    </div>
    <blockquote class="quote">“${escapeHtml(guide.name)} made our trip unforgettable. Every story brought the place to life.”</blockquote>
    ${guideReviews.length ? `<div class="profile-reviews"><h2>Traveller reviews</h2>${guideReviews.map(review => `<div class="review"><span class="stars">${"★".repeat(review.rating)}</span><p>${escapeHtml(review.text)}</p><small>— ${escapeHtml(review.author)}</small></div>`).join("")}</div>` : ""}
  </div>
  <aside class="booking-card"><h2>Book a tour</h2><p class="price">€${guide.price} <span>per person</span></p>
    <form id="bookingForm" data-guide-id="${guide.id}"><label for="tourDate">Select date</label><input id="tourDate" name="date" type="date" min="${today()}" required><label for="guestCount">Number of guests</label><select id="guestCount" name="guests">${[1,2,3,4,5,6].map(number => `<option value="${number}">${number} ${number === 1 ? "guest" : "guests"}</option>`).join("")}</select><p class="total-line">Total <strong id="bookingTotal">€${guide.price}</strong></p><button class="primary-button" type="submit">Request booking</button></form>
    <div class="booking-benefits"><span>Free cancellation up to 24 hours</span><span>Secure booking experience</span><span>Talk to your guide first</span></div></aside>`;
  $("#guestCount").addEventListener("change", event => $("#bookingTotal").textContent = `€${guide.price * Number(event.target.value)}`);
}

function tourCard(tour) {
  const guide = allGuides().find(item => item.id === Number(tour.guideId));
  const taken = state.bookings.filter(booking => booking.tourId === tour.id && !["Cancelled", "Rejected"].includes(booking.status)).reduce((sum, booking) => sum + booking.guests, 0);
  const left = Math.max(0, Number(tour.capacity) - taken);
  return `<article class="tour-card"><div class="tour-image destination-image destination-${tour.guideId}" role="img" aria-label="${escapeHtml(tour.destination)}"></div><div class="tour-card-body"><p class="eyebrow">${escapeHtml(tour.destination)}</p><h2>${escapeHtml(tour.title)}</h2><p>${escapeHtml(tour.description)}</p><div class="tour-meta"><span>◷ ${formatDate(tour.date)}</span><span>♙ ${left} spots left</span></div><div class="tour-bottom"><strong>€${tour.price} <small>/ person</small></strong><button class="teal-button" data-join="${tour.id}" ${left === 0 ? "disabled" : ""}>${left === 0 ? "Fully booked" : `Join ${escapeHtml(guide ? guide.name : "tour")}`}</button></div></div></article>`;
}

function renderExploreTours(query = "") {
  const shown = state.tours.filter(tour => !tour.cancelled && (!query || `${tour.title} ${tour.destination} ${tour.description}`.toLowerCase().includes(query)));
  $("#exploreTourGrid").innerHTML = shown.map(tourCard).join("");
  $("#emptyTourState").hidden = shown.length > 0;
}

function renderGroups() {
  $("#groupGrid").innerHTML = state.tours.filter(tour => !tour.cancelled).map(tourCard).join("") || `<div class="panel empty-panel">No group tours yet.</div>`;
}

function bookingCard(booking) {
  const guide = allGuides().find(item => item.id === booking.guideId);
  const tour = state.tours.find(item => item.id === booking.tourId);
  const name = tour?.title || `Private tour with ${guide?.name || "your guide"}`;
  const canReview = booking.status === "Completed" && !state.reviews.some(review => review.bookingId === booking.id);
  return `<article class="booking-item"><div class="booking-item-icon">✧</div><div class="booking-item-main"><h3>${escapeHtml(name)}</h3><p>${formatDate(booking.date)} · ${booking.guests} ${booking.guests === 1 ? "guest" : "guests"} · €${booking.total}</p><span class="status status-${booking.status.toLowerCase()}">${booking.status}</span></div><div class="booking-actions">${booking.status === "Accepted" ? `<button class="primary-button" data-pay="${booking.id}">Pay now</button>` : ""}${booking.status === "Paid" ? `<button class="outline-button" data-complete="${booking.id}">Mark completed</button>` : ""}${canReview ? `<button class="outline-button" data-review="${booking.id}">Leave review</button>` : ""}${["Pending", "Accepted"].includes(booking.status) ? `<button class="quiet-button" data-cancel="${booking.id}">Cancel</button>` : ""}</div></article>`;
}

function renderBookings() {
  $$("[data-booking-tab]").forEach(button => button.classList.toggle("active", button.dataset.bookingTab === state.bookingTab));
  if (!state.user) { $("#bookingList").innerHTML = `<div class="panel empty-panel"><h2>Your trips are waiting</h2><p>Log in to see and manage your bookings.</p><button class="primary-button" data-auth="login" data-next="bookings">Log in</button></div>`; return; }
  const complete = ["Completed", "Rejected", "Cancelled"];
  const items = state.bookings.filter(booking => booking.touristEmail === state.user.email && (state.bookingTab === "completed" ? complete.includes(booking.status) : !complete.includes(booking.status)));
  $("#bookingList").innerHTML = items.length ? items.slice().reverse().map(bookingCard).join("") : `<div class="panel empty-panel"><h2>No ${state.bookingTab} bookings yet</h2><p>Explore a local experience and start planning your next trip.</p><button class="outline-button" data-go="explore">Find a guide</button></div>`;
}

function renderMessages() {
  if (!state.user) { $("#conversationList").innerHTML = ""; $("#conversationPanel").innerHTML = `<div class="empty-panel"><h2>Start a conversation</h2><p>Log in to chat with a local guide.</p><button class="primary-button" data-auth="login" data-next="messages">Log in</button></div>`; return; }
  if (state.user.role === "guide") { renderGuideMessages(); return; }
  const ids = [...new Set(state.messages.filter(message => message.touristEmail === state.user.email).map(message => message.guideId))];
  $("#conversationList").innerHTML = ids.length ? ids.map(id => { const guide = allGuides().find(item => item.id === id); return `<button class="conversation-choice ${id === state.conversation ? "active" : ""}" data-conversation="${id}"><span class="portrait portrait-${guide.portrait || id}" aria-hidden="true"></span><span><b>${escapeHtml(guide.name)}</b><small>${escapeHtml(guide.city)}, ${escapeHtml(guide.country)}</small></span></button>`; }).join("") : `<div class="empty-panel">No conversations yet. Visit a guide profile to say hello.</div>`;
  if (!ids.length) { $("#conversationPanel").innerHTML = `<div class="empty-panel"><h2>Every great trip begins with hello</h2><button class="outline-button" data-go="explore">Explore guides</button></div>`; return; }
  if (!ids.includes(state.conversation)) state.conversation = ids[0];
  const guide = allGuides().find(item => item.id === state.conversation);
  const messages = state.messages.filter(message => message.guideId === state.conversation && message.touristEmail === state.user.email);
  $("#conversationPanel").innerHTML = `<div class="chat-heading"><span class="portrait portrait-${guide.portrait || guide.id}" aria-hidden="true"></span><div><b>${escapeHtml(guide.name)}</b><small>Local guide in ${escapeHtml(guide.city)}</small></div></div><div class="chat-messages">${messages.map(message => `<div class="bubble ${message.from === "me" ? "mine" : ""}">${escapeHtml(message.text)}</div>`).join("")}</div><form id="messageForm" class="message-form"><input name="message" aria-label="Message" placeholder="Write a message..." required maxlength="500"><button class="teal-button" type="submit">Send</button></form>`;
  $(".chat-messages").scrollTop = $(".chat-messages").scrollHeight;
}

function renderGuideMessages() {
  const emails = [...new Set(state.messages.filter(message => message.guideId === 5).map(message => message.touristEmail))];
  $("#conversationList").innerHTML = emails.map(email => { const account = state.accounts.find(item => item.email === email); const name = account?.name || email; return `<button class="conversation-choice ${email === state.conversationTourist ? "active" : ""}" data-conversation-tourist="${escapeHtml(email)}"><span class="avatar-letter">${escapeHtml(name.slice(0, 1).toUpperCase())}</span><span><b>${escapeHtml(name)}</b><small>Traveller</small></span></button>`; }).join("");
  if (!emails.length) { $("#conversationPanel").innerHTML = `<div class="empty-panel"><h2>No messages yet</h2><p>Travellers can contact you from your guide profile.</p></div>`; return; }
  if (!emails.includes(state.conversationTourist)) state.conversationTourist = emails[0];
  const account = state.accounts.find(item => item.email === state.conversationTourist);
  const name = account?.name || state.conversationTourist;
  const messages = state.messages.filter(message => message.guideId === 5 && message.touristEmail === state.conversationTourist);
  $("#conversationPanel").innerHTML = `<div class="chat-heading"><span class="avatar-letter">${escapeHtml(name.slice(0, 1).toUpperCase())}</span><div><b>${escapeHtml(name)}</b><small>Traveller</small></div></div><div class="chat-messages">${messages.map(message => `<div class="bubble ${message.from === "guide" ? "mine" : ""}">${escapeHtml(message.text)}</div>`).join("")}</div><form id="messageForm" class="message-form"><input name="message" aria-label="Message" placeholder="Write a message..." required maxlength="500"><button class="teal-button" type="submit">Send</button></form>`;
  $(".chat-messages").scrollTop = $(".chat-messages").scrollHeight;
}

function renderDashboard() {
  if (!state.user || state.user.role !== "guide") { $("#dashboardContent").innerHTML = `<div class="panel empty-panel"><h2>Made for local guides</h2><p>Create a guide account to manage tours, bookings and your profile.</p><button class="primary-button" data-auth="signup" data-next="dashboard">Join as a guide</button></div>`; return; }
  const myBookings = state.bookings.filter(booking => booking.guideId === 5);
  const pending = myBookings.filter(booking => booking.status === "Pending");
  const earned = myBookings.filter(booking => booking.status === "Completed").reduce((sum, booking) => sum + booking.total, 0);
  const p = state.guideProfile;
  $("#dashboardContent").innerHTML = `<div class="stat-grid"><div class="stat-card"><span>Total earnings</span><b>€${earned}</b><small>Completed tours</small></div><div class="stat-card"><span>Booking requests</span><b>${pending.length}</b><small>Awaiting your response</small></div><div class="stat-card"><span>Upcoming tours</span><b>${myBookings.filter(booking => ["Accepted", "Paid"].includes(booking.status)).length}</b><small>On your calendar</small></div></div>
  <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><p class="eyebrow">Your schedule</p><h2>Booking requests</h2></div></div>${pending.length ? pending.slice().reverse().map(booking => `<div class="request-row"><div><b>${escapeHtml(state.tours.find(tour => tour.id === booking.tourId)?.title || "Private tour")}</b><small>${formatDate(booking.date)} · ${booking.guests} guests · €${booking.total}</small></div><div><button class="teal-button" data-accept="${booking.id}">Accept</button><button class="quiet-button" data-reject="${booking.id}">Decline</button></div></div>`).join("") : '<p class="muted">No new requests right now.</p>'}</section>
  <section class="panel"><p class="eyebrow">Show travellers who you are</p><h2>Edit your profile</h2><form id="guideProfileForm" class="form-stack"><label>Display name<input name="name" value="${escapeHtml(p.name)}" required></label><label>City and country<input name="city" value="${escapeHtml(p.city)}" placeholder="Cairo, Egypt" required></label><label>About you<textarea name="bio" rows="4" required>${escapeHtml(p.bio)}</textarea></label><label>Price per person (€)<input name="price" type="number" min="1" value="${Number(p.price)}" required></label><button class="primary-button" type="submit">Save profile</button></form></section></div>
  <section class="panel dashboard-tours"><div class="panel-heading"><div><p class="eyebrow">Bring people together</p><h2>Group tours</h2></div><button class="outline-button" data-new-tour>Create a tour</button></div><p class="muted">Create a small group experience, choose its date, price and number of places.</p>${state.tours.filter(tour => tour.guideId === 5 && !tour.cancelled).map(tour => `<div class="request-row"><div><b>${escapeHtml(tour.title)}</b><small>${formatDate(tour.date)} · ${escapeHtml(tour.destination)} · ${tour.capacity} places</small></div><button class="quiet-button" data-cancel-tour="${tour.id}">Cancel tour</button></div>`).join("")}</section>`;
}

function bookTour(data) {
  state.bookings.push({ id: Date.now(), touristEmail: state.user.email, guideId: Number(data.guideId), tourId: data.tourId ? Number(data.tourId) : null, date: data.date, guests: Number(data.guests), total: Number(data.total), status: "Pending" });
  save("tourmate-bookings", state.bookings);
  closeModal(); navigate("bookings"); showToast("Booking request sent. Your guide can review it now.");
}

function requestBooking(guideId, date, guests) {
  if (!state.user) { state.pendingBooking = { guideId, date, guests }; showAuth("login", "profile"); return; }
  const guide = allGuides().find(item => item.id === guideId);
  const total = guide.price * guests;
  showModal(`<p class="eyebrow">One more step</p><h2>Review your request</h2><div class="summary-lines"><p><span>Guide</span><b>${escapeHtml(guide.name)}</b></p><p><span>Date</span><b>${formatDate(date)}</b></p><p><span>Guests</span><b>${guests}</b></p><p><span>Total</span><b>€${total}</b></p></div><p class="muted">Your request will be pending until your guide accepts it.</p><button class="primary-button wide" id="confirmBooking">Send booking request</button>`);
  $("#confirmBooking").addEventListener("click", () => bookTour({ guideId, date, guests, total }));
}

function joinTour(tourId) {
  if (!requireLogin("groups")) return;
  const tour = state.tours.find(item => item.id === tourId);
  if (!tour) return;
  if (state.bookings.some(booking => booking.tourId === tourId && booking.touristEmail === state.user.email && !["Cancelled", "Rejected"].includes(booking.status))) { showToast("You already joined this tour."); return; }
  const taken = state.bookings.filter(booking => booking.tourId === tourId && !["Cancelled", "Rejected"].includes(booking.status)).reduce((sum, booking) => sum + booking.guests, 0);
  const left = tour.capacity - taken;
  if (left <= 0) { showToast("This tour is full."); return; }
  showModal(`<p class="eyebrow">Make memories together</p><h2>${escapeHtml(tour.title)}</h2><p class="modal-copy">${formatDate(tour.date)} · ${escapeHtml(tour.destination)}</p><form id="joinForm" class="form-stack"><label>Number of guests<select name="guests">${Array.from({ length: Math.min(left, 6) }, (_, i) => `<option value="${i + 1}">${i + 1} ${i ? "guests" : "guest"}</option>`).join("")}</select></label><p class="total-line">Total <strong id="groupTotal">€${tour.price}</strong></p><button class="primary-button" type="submit">Request to join</button></form>`);
  $("#joinForm [name=guests]").addEventListener("change", event => $("#groupTotal").textContent = `€${tour.price * Number(event.target.value)}`);
  $("#joinForm").addEventListener("submit", event => { event.preventDefault(); const guests = Number(event.target.guests.value); bookTour({ guideId: tour.guideId, tourId, date: tour.date, guests, total: tour.price * guests }); });
}

function updateBooking(id, status) {
  const booking = state.bookings.find(item => item.id === id);
  if (!booking) return;
  booking.status = status;
  save("tourmate-bookings", state.bookings);
  renderBookings(); renderDashboard(); renderGroups();
  showToast(`Booking ${status.toLowerCase()}.`);
}

function payBooking(id) {
  const booking = state.bookings.find(item => item.id === id);
  if (!booking || booking.status !== "Accepted") return;
  showModal(`<p class="eyebrow">Payment preview</p><h2>Complete your booking</h2><div class="summary-lines"><p><span>Amount due</span><b>€${booking.total}</b></p><p><span>Booking status</span><b>Accepted</b></p></div><p class="muted">This UI prototype does not collect card details or charge money. The button below demonstrates the paid state.</p><button class="primary-button wide" id="demoPay">Confirm demo payment</button>`);
  $("#demoPay").addEventListener("click", () => { closeModal(); updateBooking(id, "Paid"); });
}

function reviewBooking(id) {
  const booking = state.bookings.find(item => item.id === id);
  if (!booking || booking.status !== "Completed" || state.reviews.some(review => review.bookingId === id)) return;
  showModal(`<p class="eyebrow">Share your story</p><h2>Rate your guide</h2><form id="reviewForm" class="form-stack"><label>Rating<select name="rating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Great</option><option value="3">★★★ Good</option><option value="2">★★ Fair</option><option value="1">★ Poor</option></select></label><label>Your review<textarea name="text" rows="4" maxlength="500" placeholder="What made the tour memorable?" required></textarea></label><button class="primary-button" type="submit">Submit review</button></form>`);
  $("#reviewForm").addEventListener("submit", event => { event.preventDefault(); const form = new FormData(event.target); state.reviews.push({ bookingId: id, guideId: booking.guideId, author: state.user?.name || "Traveller", rating: Number(form.get("rating")), text: String(form.get("text")).trim() }); save("tourmate-reviews", state.reviews); closeModal(); renderBookings(); showToast("Thanks for sharing your experience."); });
}

function startConversation(guideId) {
  if (!requireLogin("messages")) return;
  state.conversation = guideId;
  if (!state.messages.some(message => message.guideId === guideId && message.touristEmail === state.user.email)) { state.messages.push({ guideId, touristEmail: state.user.email, from: "guide", text: `Hello! I'm ${allGuides().find(item => item.id === guideId).name}. What would you like to know about the tour?` }); save("tourmate-messages", state.messages); }
  navigate("messages");
}

function showNewTour() {
  showModal(`<p class="eyebrow">Bring travellers together</p><h2>Create a group tour</h2><form id="tourForm" class="form-stack"><label>Tour title<input name="title" required placeholder="A walk through my city"></label><label>Destination<input name="destination" required placeholder="Cairo, Egypt"></label><label>Date<input name="date" type="date" min="${today()}" required></label><div class="form-columns"><label>Price per person (€)<input name="price" type="number" min="1" required></label><label>Maximum guests<input name="capacity" type="number" min="1" max="30" required></label></div><label>Description<textarea name="description" rows="3" required></textarea></label><button class="primary-button" type="submit">Publish tour</button></form>`);
  $("#tourForm").addEventListener("submit", event => { event.preventDefault(); const form = new FormData(event.target); state.tours.push({ id: Date.now(), title: String(form.get("title")).trim(), destination: String(form.get("destination")).trim(), date: form.get("date"), price: Number(form.get("price")), capacity: Number(form.get("capacity")), description: String(form.get("description")).trim(), guideId: 5 }); save("tourmate-tours", state.tours); closeModal(); renderDashboard(); showToast("Group tour published."); });
}

function cancelTour(id) {
  const tour = state.tours.find(item => item.id === id);
  if (!tour) return;
  tour.cancelled = true;
  state.bookings.filter(booking => booking.tourId === id && !["Completed", "Rejected", "Cancelled"].includes(booking.status)).forEach(booking => booking.status = "Cancelled");
  save("tourmate-tours", state.tours);
  save("tourmate-bookings", state.bookings);
  renderDashboard();
  showToast("Tour cancelled. Participants' bookings were updated.");
}

document.addEventListener("click", event => {
  const target = event.target.closest("button, [data-guide]");
  if (!target) return;
  if (target.matches("[data-close]")) return closeModal();
  if (target.dataset.go) { closeModal(); return navigate(target.dataset.go); }
  if (target.dataset.auth) return showAuth(target.dataset.auth, target.dataset.next || "");
  if (target.dataset.save) { const id = Number(target.dataset.save); state.saved = state.saved.includes(id) ? state.saved.filter(item => item !== id) : [...state.saved, id]; save("tourmate-saved", state.saved); renderGuides(); showToast(state.saved.includes(id) ? "Guide saved" : "Guide removed"); return; }
  if (target.dataset.guide) { state.selectedGuide = Number(target.dataset.guide); return navigate("profile"); }
  if (target.dataset.category) { state.category = target.dataset.category; $$(".chip").forEach(chip => chip.classList.toggle("active", chip === target)); return renderGuides(); }
  if (target.dataset.join) return joinTour(Number(target.dataset.join));
  if (target.dataset.bookingTab) { state.bookingTab = target.dataset.bookingTab; return renderBookings(); }
  if (target.dataset.pay) return payBooking(Number(target.dataset.pay));
  if (target.dataset.complete) return updateBooking(Number(target.dataset.complete), "Completed");
  if (target.dataset.cancel) return updateBooking(Number(target.dataset.cancel), "Cancelled");
  if (target.dataset.review) return reviewBooking(Number(target.dataset.review));
  if (target.dataset.accept) return updateBooking(Number(target.dataset.accept), "Accepted");
  if (target.dataset.reject) return updateBooking(Number(target.dataset.reject), "Rejected");
  if (target.dataset.messageGuide) return startConversation(Number(target.dataset.messageGuide));
  if (target.dataset.conversation) { state.conversation = Number(target.dataset.conversation); return renderMessages(); }
  if (target.dataset.conversationTourist) { state.conversationTourist = target.dataset.conversationTourist; return renderMessages(); }
  if (target.dataset.cancelTour) return cancelTour(Number(target.dataset.cancelTour));
  if (target.hasAttribute("data-new-tour")) return showNewTour();
  if (target.hasAttribute("data-me")) { if (state.user) $("#accountButton").click(); else showAuth("login"); return; }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
  if (event.key === "Enter" && event.target.matches("[data-guide]")) { state.selectedGuide = Number(event.target.dataset.guide); navigate("profile"); }
});
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
$("#menuButton").addEventListener("click", () => { const open = $("#mobileMenu").classList.toggle("open"); $("#menuButton").setAttribute("aria-expanded", String(open)); });
$("#accountButton").addEventListener("click", () => showModal(`<p class="eyebrow">Your account</p><h2>Hi, ${escapeHtml(state.user.name)}</h2><p class="modal-copy">${escapeHtml(state.user.email)} · ${state.user.role === "guide" ? "Local guide" : "Traveller"}</p><div class="account-links"><button class="outline-button" data-go="${state.user.role === "guide" ? "dashboard" : "bookings"}">Go to ${state.user.role === "guide" ? "dashboard" : "bookings"}</button><button class="quiet-button" id="logoutButton">Log out</button></div>`));

document.addEventListener("submit", event => {
  if (event.target.id === "heroSearch") { event.preventDefault(); $("#placeFilter").value = $("#destinationInput").value.trim(); navigate("explore"); }
  if (event.target.id === "filterForm") { event.preventDefault(); renderGuides(); }
  if (event.target.id === "bookingForm") { event.preventDefault(); const form = new FormData(event.target); requestBooking(Number(event.target.dataset.guideId), form.get("date"), Number(form.get("guests"))); }
  if (event.target.id === "authForm") {
    event.preventDefault();
    const form = new FormData(event.target);
    const email = String(form.get("email")).trim().toLowerCase();
    const next = event.target.dataset.next;
    if (event.target.dataset.mode === "signup") {
      if (state.accounts.some(account => account.email === email)) { showToast("This email already has an account. Please log in."); return; }
      state.user = { name: String(form.get("name")).trim(), email, role: String(form.get("role")) };
      state.accounts.push(state.user);
      save("tourmate-accounts", state.accounts);
      if (state.user.role === "guide") { state.guideProfile.name = state.user.name; save("tourmate-guide-profile", state.guideProfile); }
    } else {
      state.user = state.accounts.find(account => account.email === email) || { name: email.split("@")[0], email, role: "tourist" };
    }
    save("tourmate-user", state.user);
    closeModal(); updateAccount();
    if (next) navigate(next); else navigate(state.user.role === "guide" ? "dashboard" : "explore");
    if (state.pendingBooking) { const draft = state.pendingBooking; state.pendingBooking = null; requestBooking(draft.guideId, draft.date, draft.guests); }
    else showToast(`Welcome, ${state.user.name}!`);
  }
  if (event.target.id === "messageForm") { event.preventDefault(); const input = event.target.elements.message; const text = input.value.trim(); if (!text) return; state.messages.push(state.user.role === "guide" ? { guideId: 5, touristEmail: state.conversationTourist, from: "guide", text } : { guideId: state.conversation, touristEmail: state.user.email, from: "me", text }); save("tourmate-messages", state.messages); renderMessages(); }
  if (event.target.id === "guideProfileForm") { event.preventDefault(); const form = new FormData(event.target); state.guideProfile = { name: String(form.get("name")).trim(), city: String(form.get("city")).trim(), bio: String(form.get("bio")).trim(), price: Number(form.get("price")) }; save("tourmate-guide-profile", state.guideProfile); renderGuides(); showToast("Profile updated. Travellers can now see it in Explore."); }
});

document.addEventListener("click", event => { if (event.target.id === "logoutButton") { state.user = null; localStorage.removeItem("tourmate-user"); closeModal(); updateAccount(); navigate("home"); showToast("Logged out."); } });
window.addEventListener("hashchange", () => openView(location.hash.slice(1) || "home"));
updateAccount();
openView(location.hash.slice(1) || "home");
