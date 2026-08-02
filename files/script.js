// ============ DATA ============
const categories = [
  { icon: "🚗", color: "#eaf0ff", fg: "#2a5be0", name: "Cars & Sedans", desc: "Hatchbacks, Sedans, SUVs & Luxury Cars", price: "Starting ₹8/km" },
  { icon: "🏍️", color: "#f3ecff", fg: "#8a4fe0", name: "Bikes & Scooters", desc: "Bikes, Scooters & Electric Two Wheelers", price: "Starting ₹2/km" },
  { icon: "🚌", color: "#e6f8f2", fg: "#1fa971", name: "Buses", desc: "AC, Non-AC, Luxury & Volvo Buses", price: "Starting ₹25/km" },
  { icon: "🚚", color: "#fdeceb", fg: "#e0542a", name: "Commercial Vehicles", desc: "Trucks, Pickups, Tempo & Trailers", price: "Starting ₹20/km" },
  { icon: "🚐", color: "#fdeef7", fg: "#d6478f", name: "Vans & Minibuses", desc: "Tempo Traveller, Minibus & More", price: "Starting ₹16/km" },
  { icon: "🔋", color: "#eaf8ea", fg: "#2f9e44", name: "EV Vehicles", desc: "Electric Cars & Bikes for a Green Ride", price: "Starting ₹16/km" },
];

const whyUs = [
  { icon: "fa-layer-group", title: "Comprehensive Ecosystem", desc: "All vehicle types under one platform" },
  { icon: "fa-user-shield", title: "Verified & Trusted Partners", desc: "Background verified drivers & operators" },
  { icon: "fa-hand-holding-dollar", title: "Transparent Pricing", desc: "No hidden charges, what you see is what you pay" },
  { icon: "fa-microchip", title: "Advanced Technology", desc: "Smart booking, real-time tracking & instant confirmations" },
  { icon: "fa-headset", title: "24x7 Customer Support", desc: "Always here to assist you, anytime anywhere" },
  { icon: "fa-shield-halved", title: "Safety First", desc: "Regular vehicle checks & safety compliance" },
];

const stats = [
  { icon: "fa-users", value: "50,000+", label: "Happy Customers" },
  { icon: "fa-car", value: "5,000+", label: "Vehicles" },
  { icon: "fa-city", value: "250+", label: "Cities" },
  { icon: "fa-clock", value: "99.5%", label: "On-Time Service" },
];

const testimonials = [
  { initials: "RK", name: "Rajesh Kumar", role: "Operations Manager, TechSoft", text: "Vajra Mobility made our corporate travel so seamless. Great service, on-time and very professional." },
  { initials: "PS", name: "Priya Sharma", role: "Teacher", text: "Booked a bus for our family trip. Excellent experience from booking to the journey." },
  { initials: "AM", name: "Arjun Mehta", role: "Business Owner", text: "Affordable pricing, clean vehicles and supportive customer care. Highly recommended." },
];

// ============ RENDER HELPERS ============
function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;
  grid.innerHTML = categories.map(c => `
    <div class="category-card">
      <div class="icon" style="background:${c.color}; color:${c.fg}">${c.icon}</div>
      <h3>${c.name}</h3>
      <p>${c.desc}</p>
      <div class="price">${c.price}</div>
    </div>
  `).join("");
}

function renderWhyUs() {
  const grid = document.getElementById("whyGrid");
  if (!grid) return;
  grid.innerHTML = whyUs.map(w => `
    <div class="why-card">
      <div class="icon"><i class="fas ${w.icon}"></i></div>
      <h4>${w.title}</h4>
      <p>${w.desc}</p>
    </div>
  `).join("");
}

function renderStats() {
  const grid = document.getElementById("statsGrid");
  if (!grid) return;
  grid.innerHTML = stats.map(s => `
    <div class="stat">
      <i class="fas ${s.icon}"></i>
      <div>
        <strong>${s.value}</strong>
        <span>${s.label}</span>
      </div>
    </div>
  `).join("");
}

function renderTestimonials() {
  const grid = document.getElementById("testimonialGrid");
  if (!grid) return;
  grid.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="stars">${"★".repeat(5)}</div>
      <p>"${t.text}"</p>
      <div class="author">
        <div class="avatar">${t.initials}</div>
        <div>
          <strong>${t.name}</strong>
          <span>${t.role}</span>
        </div>
      </div>
    </div>
  `).join("");
}

// ============ INTERACTIONS ============
function setupTabs() {
  const tabs = document.querySelectorAll(".booking-tabs .tab");
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });
}

function setupSwap() {
  const swapBtn = document.getElementById("swapBtn");
  if (!swapBtn) return;
  const inputs = document.querySelectorAll(".booking-form input[type='text']");
  swapBtn.addEventListener("click", () => {
    const from = inputs[0];
    const to = inputs[1];
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
  });
}

function setupDatePicker() {
  const dateInput = document.getElementById("dateInput");
  if (!dateInput) return;
  const today = new Date().toISOString().split("T")[0];
  dateInput.type = "date";
  dateInput.min = today;
}

function setupFormSubmit() {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = form.querySelectorAll("input[type='text']");
    const from = inputs[0].value.trim();
    const to = inputs[1] ? inputs[1].value.trim() : "";
    const date = document.getElementById("dateInput")?.value || "";
    const vehicle = form.querySelector("select")?.value || "";

    if (!from) {
      alert("Please enter a pickup location to search vehicles.");
      return;
    }

    const params = new URLSearchParams({ from, to, date, vehicle });
    window.location.href = `book-ride.html?${params.toString()}`;
  });
}

function setupNavDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".dropdown-toggle");

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains("open");

      // close any other open dropdowns first
      dropdowns.forEach(d => {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      });

      if (!isOpen) {
        dropdown.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });

  // close dropdown when clicking anywhere else
  document.addEventListener("click", () => {
    dropdowns.forEach(d => {
      d.classList.remove("open");
      d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
    });
  });

  // close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach(d => {
        d.classList.remove("open");
        d.querySelector(".dropdown-toggle").setAttribute("aria-expanded", "false");
      });
    }
  });
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  renderWhyUs();
  renderStats();
  renderTestimonials();
  setupTabs();
  setupSwap();
  setupDatePicker();
  setupFormSubmit();
  setupNavDropdowns();
});
