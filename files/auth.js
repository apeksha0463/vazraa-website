// ============ PASSWORD VISIBILITY TOGGLE ============
function setupPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const targetId = icon.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      icon.classList.toggle("fa-eye", !isHidden);
      icon.classList.toggle("fa-eye-slash", isHidden);
    });
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getBaseUrl() {
  return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || "http://localhost:5000";
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message || "An error occurred.";
  el.classList.add("show");
}

function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove("show");
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait…" : btn.dataset.originalText || btn.textContent;
}

// ============ LOGIN FORM ============
function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("loginId");
    const password   = document.getElementById("loginPassword");
    let valid = true;

    if (!identifier.value.trim()) {
      document.getElementById("loginIdError").classList.add("show");
      valid = false;
    } else {
      document.getElementById("loginIdError").classList.remove("show");
    }

    if (password.value.length < 6) {
      document.getElementById("loginPasswordError").classList.add("show");
      valid = false;
    } else {
      document.getElementById("loginPasswordError").classList.remove("show");
    }

    if (!valid) return;

    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      setButtonLoading(submitBtn, true);
    }

    try {
      // Try customer login first, then admin
      const response = await fetch(`${getBaseUrl()}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ identifier: identifier.value.trim(), password: password.value }),
      });

      const data = await response.json();

      if (data.success) {
        // Store JWT and user info
        localStorage.setItem("vazraa_token",    data.data.token);
        localStorage.setItem("vazraa_user",     JSON.stringify(data.data.user));
        localStorage.setItem("vazraa_role",     data.data.user.role);
        // Redirect to homepage
        window.location.href = "index.html";
      } else {
        showError("loginPasswordError", data.message || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      showError("loginPasswordError", "Could not reach server. Please check your connection.");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ============ SIGNUP FORM ============
function setupSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  let selectedRole = "customer";
  const roleToggle = document.getElementById("roleToggle");

  if (roleToggle) {
    const roleButtons = roleToggle.querySelectorAll("button");
    roleButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        roleButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedRole = btn.getAttribute("data-role");
      });
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName       = document.getElementById("fullName").value.trim();
    const phone          = document.getElementById("phone").value.trim();
    const email          = document.getElementById("email").value.trim();
    const password       = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const agreeTerms     = document.getElementById("agreeTerms").checked;
    const errorBox       = document.getElementById("signupError");

    const valid =
      fullName && phone && email &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreeTerms;

    if (!valid) {
      errorBox.textContent = "Passwords do not match, or a required field is missing.";
      errorBox.classList.add("show");
      return;
    }
    errorBox.classList.remove("show");

    const submitBtn = form.querySelector("[type='submit']");
    if (submitBtn) {
      submitBtn.dataset.originalText = submitBtn.textContent;
      setButtonLoading(submitBtn, true);
    }

    // For driver role — redirect to onboarding (driver registers via onboarding form)
    if (selectedRole === "driver") {
      const params = new URLSearchParams({ name: fullName, phone, email });
      window.location.href = `driver-onboarding.html?${params.toString()}`;
      return;
    }

    // Customer registration via API
    try {
      const response = await fetch(`${getBaseUrl()}/api/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: fullName, email, phone, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user
        localStorage.setItem("vazraa_token", data.data.token);
        localStorage.setItem("vazraa_user",  JSON.stringify(data.data.user));
        localStorage.setItem("vazraa_role",  "customer");
        // Redirect to customer onboarding
        const params = new URLSearchParams({ name: fullName, phone, email });
        window.location.href = `customer-onboarding.html?${params.toString()}`;
      } else {
        errorBox.textContent = data.message || "Registration failed. Please try again.";
        errorBox.classList.add("show");
      }
    } catch (err) {
      errorBox.textContent = "Could not reach server. Please check your connection.";
      errorBox.classList.add("show");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

// ============ INIT ============
document.addEventListener("DOMContentLoaded", () => {
  setupPasswordToggles();
  setupLoginForm();
  setupSignupForm();
});
