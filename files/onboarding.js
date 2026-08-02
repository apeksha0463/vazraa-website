// ─── Helpers ────────────────────────────────────────────────────────────────
function getBaseUrl() {
  return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || "http://localhost:5000";
}

function getToken() {
  return localStorage.getItem("vazraa_token") || "";
}

// ============ CUSTOMER ONBOARDING ============
function setupCustomerOnboarding() {
  const form = document.getElementById("customerForm");
  if (!form) return;

  // prefill from signup redirect (?name=&phone=&email=)
  const params = new URLSearchParams(window.location.search);
  if (params.get("name"))  document.getElementById("custName").value  = params.get("name");
  if (params.get("phone")) document.getElementById("custPhone").value = params.get("phone");
  if (params.get("email")) document.getElementById("custEmail").value = params.get("email");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Customer was already registered in auth.js signup step (JWT stored).
    // This onboarding form collects supplementary preferences.
    // If a token exists, we just show success. No separate API call needed for v1.
    const token = getToken();

    if (token) {
      // Profile is already created via /api/auth/register.
      // Optionally call PUT /api/profile here to persist extra fields in future.
      form.style.display = "none";
      const successEl = document.getElementById("customerSuccess");
      if (successEl) successEl.style.display = "block";
    } else {
      // If user arrived directly (no prior registration), register them now
      const name     = document.getElementById("custName")?.value.trim()  || "";
      const phone    = document.getElementById("custPhone")?.value.trim() || "";
      const email    = document.getElementById("custEmail")?.value.trim() || "";
      const password = document.getElementById("custPassword")?.value     || "Vazraa@2024";

      if (!name || !phone || !email) {
        alert("Please fill in all required fields.");
        return;
      }

      const submitBtn = form.querySelector("[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name, email, phone, password }),
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem("vazraa_token", data.data.token);
          localStorage.setItem("vazraa_user",  JSON.stringify(data.data.user));
          localStorage.setItem("vazraa_role",  "customer");
          form.style.display = "none";
          const successEl = document.getElementById("customerSuccess");
          if (successEl) successEl.style.display = "block";
        } else {
          alert(data.message || "Registration failed. Please try again.");
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (err) {
        alert("Could not reach server. Please check your connection.");
        if (submitBtn) submitBtn.disabled = false;
      }
    }
  });
}

// ============ DRIVER ONBOARDING STEPPER ============
function setupDriverOnboarding() {
  const form = document.getElementById("driverForm");
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 4;
  const uploadedDocs = {};

  const steps  = document.querySelectorAll("#stepper .step");
  const panels = document.querySelectorAll(".step-panel");

  function goToStep(step) {
    steps.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.remove("active", "done");
      if (n < step) s.classList.add("done");
      if (n === step) s.classList.add("active");
    });
    panels.forEach(p => {
      p.classList.toggle("active", Number(p.dataset.panel) === step);
    });
    currentStep = step;
    if (step === 4) buildReview();
    window.scrollTo({ top: document.querySelector(".onboarding-card").offsetTop - 30, behavior: "smooth" });
  }

  function validateStep(step) {
    const panel = document.querySelector(`.step-panel[data-panel="${step}"]`);
    const requiredFields = panel.querySelectorAll("[required]");
    for (const field of requiredFields) {
      if (!field.value || !field.value.trim()) {
        field.focus();
        return false;
      }
    }
    if (step === 3) {
      const allUploaded = ["license", "rc", "insurance", "photo"].every(doc => uploadedDocs[doc]);
      const docsError = document.getElementById("docsError");
      if (!allUploaded) {
        docsError.classList.add("show");
        return false;
      }
      docsError.classList.remove("show");
    }
    return true;
  }

  form.querySelectorAll(".next-step").forEach(btn => {
    btn.addEventListener("click", () => {
      if (validateStep(currentStep) && currentStep < totalSteps) {
        goToStep(currentStep + 1);
      }
    });
  });

  form.querySelectorAll(".prev-step").forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  });

  // document upload boxes
  document.querySelectorAll(".upload-box").forEach(box => {
    const input  = box.querySelector("input[type='file']");
    const docKey = box.dataset.doc;
    input.addEventListener("change", () => {
      if (input.files.length > 0) {
        uploadedDocs[docKey] = input.files[0].name;
        box.classList.add("has-file");
        box.querySelector("p").textContent = input.files[0].name;
      }
    });
  });

  function buildReview() {
    const reviewList = document.getElementById("reviewList");
    const rows = [
      ["Full Name",         document.getElementById("drvName").value],
      ["Phone",             document.getElementById("drvPhone").value],
      ["Email",             document.getElementById("drvEmail").value],
      ["City",              document.getElementById("drvCity").value],
      ["Vehicle Type",      document.getElementById("vehType").value],
      ["Vehicle Model",     document.getElementById("vehModel").value],
      ["Registration No.",  document.getElementById("vehReg").value],
      ["Documents Uploaded", Object.keys(uploadedDocs).length + " / 4"],
    ];
    reviewList.innerHTML = rows.map(([label, value]) => `
      <div class="review-row"><span>${label}</span><span>${value || "-"}</span></div>
    `).join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    // Collect all driver data from the multi-step form
    const params = new URLSearchParams(window.location.search);
    const payload = {
      name:         document.getElementById("drvName").value.trim(),
      phone:        document.getElementById("drvPhone").value.trim(),
      email:        document.getElementById("drvEmail").value.trim(),
      password:     "Vazraa@Driver2024",  // Temporary default — driver sets password later
      city:         document.getElementById("drvCity")?.value.trim()    || params.get("city")    || "",
      address:      document.getElementById("drvAddress")?.value.trim() || "",
      vehicleType:  document.getElementById("vehType").value,
      vehicleModel: document.getElementById("vehModel").value.trim(),
      vehicleRegNo: document.getElementById("vehReg").value.trim(),
      vehicleYear:  Number(document.getElementById("vehYear")?.value) || new Date().getFullYear(),
      // Document names (real file upload to object storage in future)
      licenseDoc:   uploadedDocs["license"]  || "",
      rcDoc:        uploadedDocs["rc"]        || "",
      insuranceDoc: uploadedDocs["insurance"] || "",
      photoDoc:     uploadedDocs["photo"]     || "",
    };

    try {
      const response = await fetch(`${getBaseUrl()}/api/drivers/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // Show success UI
        const stepper = document.querySelector(".stepper");
        if (stepper) stepper.style.display = "none";
        form.style.display = "none";
        const successEl = document.getElementById("driverSuccess");
        if (successEl) successEl.style.display = "block";
      } else {
        alert(data.message || "Registration failed. Please check your details and try again.");
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      alert("Could not reach server. Please check your connection.");
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  setupCustomerOnboarding();
  setupDriverOnboarding();
});
