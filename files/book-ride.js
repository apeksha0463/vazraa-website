function setupBookRidePage() {
  const grid = document.getElementById("vehicleSelectGrid");
  if (!grid) return;

  const fareContent = document.getElementById("fareContent");
  const form = document.getElementById("rideForm");
  let selectedRate = null;
  let selectedType = null;
  let selectedCategory = null;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getBaseUrl() {
    return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || "http://localhost:5000";
  }

  function getToken() {
    return localStorage.getItem("vazraa_token") || "";
  }

  // prefill from query params (?from=&to=&date=&vehicle=&type=&mode=)
  const params = new URLSearchParams(window.location.search);
  if (params.get("from")) document.getElementById("rideFrom").value = params.get("from");
  if (params.get("to"))   document.getElementById("rideTo").value   = params.get("to");
  if (params.get("date")) document.getElementById("rideDate").value  = params.get("date");

  // if a vehicle type was passed in via ?type=, pre-select that card
  const preselectType = params.get("type");
  if (preselectType) {
    const match = grid.querySelector(`[data-type="${preselectType}"]`);
    if (match) match.click();
  }

  grid.querySelectorAll(".vehicle-option").forEach(option => {
    option.addEventListener("click", () => {
      grid.querySelectorAll(".vehicle-option").forEach(o => o.classList.remove("selected"));
      option.classList.add("selected");
      selectedRate     = Number(option.dataset.rate);
      selectedCategory = option.dataset.type;
      selectedType     = option.querySelector("h4").textContent;
      updateFare();
    });
  });

  function estimateDistanceKm() {
    // NOTE: Fixed 12 km mock — Google Maps Distance Matrix API in future.
    return 12;
  }

  function updateFare() {
    if (!selectedRate) {
      fareContent.innerHTML = `<div class="fare-empty">Select a vehicle type to see your fare estimate.</div>`;
      return;
    }
    const distance    = estimateDistanceKm();
    const base        = 30;
    const distanceFare = distance * selectedRate;
    const platformFee  = 15;
    const total        = base + distanceFare + platformFee;

    fareContent.innerHTML = `
      <div class="fare-row"><span>Vehicle Type</span><span>${selectedType}</span></div>
      <div class="fare-row"><span>Estimated Distance</span><span>${distance} km</span></div>
      <div class="fare-row"><span>Base Fare</span><span>₹${base}</span></div>
      <div class="fare-row"><span>Distance Fare</span><span>₹${distanceFare}</span></div>
      <div class="fare-row"><span>Platform Fee</span><span>₹${platformFee}</span></div>
      <div class="fare-row total"><span>Total Estimate</span><span>₹${total}</span></div>
      <button type="button" class="btn btn--primary btn--submit" id="confirmBookingBtn">Confirm Booking</button>
      <div class="form-error" id="confirmError" style="margin-top:10px;">Please fill in pickup, drop, date and time first.</div>
      <div class="booking-success" id="bookingSuccess" style="display:none; margin-top:12px; padding:12px; background:#e6f9f0; border-radius:8px; color:#1a7a4a; font-weight:600;"></div>
    `;

    document.getElementById("confirmBookingBtn").addEventListener("click", async () => {
      const from       = document.getElementById("rideFrom").value.trim();
      const to         = document.getElementById("rideTo").value.trim();
      const date       = document.getElementById("rideDate").value;
      const time       = document.getElementById("rideTime").value;
      const passengers = document.getElementById("ridePassengers")?.value || "1 Passenger";
      const errorBox   = document.getElementById("confirmError");
      const successBox = document.getElementById("bookingSuccess");
      const btn        = document.getElementById("confirmBookingBtn");

      if (!from || !to || !date || !time) {
        errorBox.classList.add("show");
        return;
      }
      errorBox.classList.remove("show");

      // Require login
      const token = getToken();
      if (!token) {
        errorBox.textContent = "Please login to book a ride.";
        errorBox.classList.add("show");
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
        return;
      }

      btn.disabled     = true;
      btn.textContent  = "Booking…";

      try {
        const response = await fetch(`${getBaseUrl()}/api/bookings`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup:          from,
            drop:            to,
            vehicleType:     selectedType,
            vehicleCategory: selectedCategory,
            scheduledDate:   date,
            scheduledTime:   time,
            passengers,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Save booking reference for convenience
          localStorage.setItem("vazraa_last_booking", JSON.stringify(data.data));

          successBox.innerHTML = `
            ✅ Booking Confirmed!<br>
            <strong>Booking #:</strong> ${data.data.bookingNumber}<br>
            <strong>Fare:</strong> ₹${data.data.estimatedFare}<br>
            <strong>Status:</strong> ${data.data.status}<br>
            <strong>OTP:</strong> ${data.data.rideOtp} (show to driver)
          `;
          successBox.style.display = "block";
          btn.textContent  = "Booked!";
        } else {
          errorBox.textContent = data.message || "Booking failed. Please try again.";
          errorBox.classList.add("show");
          btn.disabled    = false;
          btn.textContent = "Confirm Booking";
        }
      } catch (err) {
        errorBox.textContent = "Could not reach server. Please check your connection.";
        errorBox.classList.add("show");
        btn.disabled    = false;
        btn.textContent = "Confirm Booking";
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", setupBookRidePage);
