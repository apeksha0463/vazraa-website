function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const phone = document.getElementById("contactPhone").value.trim();
    const email = document.getElementById("contactEmail").value.trim();
    const message = document.getElementById("contactMessage").value.trim();
    const errorBox = document.getElementById("contactError");

    if (!name || !phone || !email || !message) {
      errorBox.classList.add("show");
      return;
    }
    errorBox.classList.remove("show");

    // NOTE: replace this with a real API call (e.g. send to your email service,
    // a backend endpoint, or a form service like Formspree) to actually deliver
    // this message. Right now it only shows a success state on-screen.
    form.style.display = "none";
    document.getElementById("contactSuccess").style.display = "block";
  });
}

document.addEventListener("DOMContentLoaded", setupContactForm);
