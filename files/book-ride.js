// ─── Google Maps Autocomplete + Distance Matrix ───────────────────────────────
// Called by the Google Maps script tag callback once the API has loaded
window.initGoogleMapsAutocomplete = function () {
  const fromInput = document.getElementById('rideFrom');
  const toInput   = document.getElementById('rideTo');
  if (!fromInput || !toInput) return;

  const options = {
    componentRestrictions: { country: 'in' }, // India only
    fields: ['formatted_address', 'geometry', 'name'],
    types: ['geocode', 'establishment'],
  };

  const autocompleteFrom = new google.maps.places.Autocomplete(fromInput, options);
  const autocompleteTo   = new google.maps.places.Autocomplete(toInput,   options);

  // Store selected place geometry so Distance Matrix can use coordinates
  let originPlace      = null;
  let destinationPlace = null;

  autocompleteFrom.addListener('place_changed', () => {
    const place = autocompleteFrom.getPlace();
    if (place && place.geometry) {
      originPlace = place;
      // Trigger fare update if both places are selected
      if (destinationPlace) window._triggerFareUpdate && window._triggerFareUpdate();
    }
  });

  autocompleteTo.addListener('place_changed', () => {
    const place = autocompleteTo.getPlace();
    if (place && place.geometry) {
      destinationPlace = place;
      if (originPlace) window._triggerFareUpdate && window._triggerFareUpdate();
    }
  });

  // Expose getter so book-ride.js can access places
  window._getPlaces = () => ({ originPlace, destinationPlace });
};

// ─── Book Ride Page Logic ─────────────────────────────────────────────────────
function setupBookRidePage() {
  const grid = document.getElementById('vehicleSelectGrid');
  if (!grid) return;

  const fareContent = document.getElementById('fareContent');
  const form        = document.getElementById('rideForm');
  let selectedRate     = null;
  let selectedType     = null;
  let selectedCategory = null;
  let realDistanceKm   = null; // set by Distance Matrix API
  let distanceTxt      = null; // human-readable e.g. "14.2 km"
  let durationTxt      = null; // e.g. "28 mins"

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getBaseUrl() {
    return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'http://localhost:5000';
  }

  function getToken() {
    return localStorage.getItem('vazraa_token') || '';
  }

  // ─── Draft Auto-Save / Auto-Restore ─────────────────────────────────────
  const DRAFT_KEY = 'vazraa_booking_draft';

  function saveDraft() {
    const draft = {
      from:    document.getElementById('rideFrom')?.value || '',
      to:      document.getElementById('rideTo')?.value   || '',
      vehicle: selectedCategory || '',
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft) return;

      const fromEl = document.getElementById('rideFrom');
      const toEl   = document.getElementById('rideTo');

      if (fromEl && draft.from) fromEl.value = draft.from;
      if (toEl   && draft.to)   toEl.value   = draft.to;

      // Re-select the vehicle card
      if (draft.vehicle) {
        const match = grid.querySelector(`[data-type="${draft.vehicle}"]`);
        if (match) match.click();
      }

      // Show a subtle toast so the user knows their data was restored
      if (draft.from || draft.to || draft.date) {
        showRestoredToast();
      }
    } catch (e) { /* ignore */ }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  function showRestoredToast() {
    const toast = document.createElement('div');
    toast.textContent = '✅ Your previous details have been restored!';
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1a7a4a; color: #fff; padding: 12px 24px;
      border-radius: 999px; font-size: 13px; font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 9999;
      animation: fadeInUp .3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ─── Prefill from query params (takes priority over draft) ─────────────────
  const params = new URLSearchParams(window.location.search);
  if (params.get('from')) document.getElementById('rideFrom').value = params.get('from');
  if (params.get('to'))   document.getElementById('rideTo').value   = params.get('to');
  if (params.get('date')) document.getElementById('rideDate').value  = params.get('date');

  // Restore draft if no query params were provided
  if (!params.get('from') && !params.get('to')) {
    restoreDraft();
  }

  const preselectType = params.get('type');
  if (preselectType) {
    const match = grid.querySelector(`[data-type="${preselectType}"]`);
    if (match) match.click();
  }

  // ─── Wire up auto-save on every input change ──────────────────────────────
  ['rideFrom', 'rideTo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveDraft);
    if (el) el.addEventListener('change', saveDraft);
  });

  // ─── Vehicle selection ─────────────────────────────────────────────────────
  grid.querySelectorAll('.vehicle-option').forEach(option => {
    option.addEventListener('click', () => {
      grid.querySelectorAll('.vehicle-option').forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      selectedRate     = Number(option.dataset.rate);
      selectedCategory = option.dataset.type;
      selectedType     = option.querySelector('h4').textContent;
      saveDraft(); // save selected vehicle to draft

      // If we already have a real distance, update fare immediately
      if (realDistanceKm !== null) {
        renderFare(realDistanceKm, distanceTxt, durationTxt);
      } else {
        // Try to calculate distance if both fields have values
        tryCalculateDistance();
      }
    });
  });

  // ─── Distance Matrix ───────────────────────────────────────────────────────
  function tryCalculateDistance() {
    // Prefer Places geometry; fall back to typed text
    const places = window._getPlaces ? window._getPlaces() : {};
    const fromEl  = document.getElementById('rideFrom');
    const toEl    = document.getElementById('rideTo');
    const fromVal = fromEl ? fromEl.value.trim() : '';
    const toVal   = toEl   ? toEl.value.trim()   : '';

    if (!fromVal || !toVal) return;

    // Show loading indicator in fare card
    fareContent.innerHTML = `
      <div class="fare-empty" style="display:flex; align-items:center; gap:10px;">
        <i class="fa fa-spinner fa-spin" style="color:var(--yellow-600,#ca8a04);"></i>
        Calculating real distance…
      </div>`;

    const origin      = places.originPlace      ? places.originPlace.geometry.location      : fromVal;
    const destination = places.destinationPlace ? places.destinationPlace.geometry.location : toVal;

    // If Google Maps API not loaded yet, fall back to 12 km mock
    if (typeof google === 'undefined' || !google.maps) {
      realDistanceKm = 12; distanceTxt = '~12 km'; durationTxt = '';
      if (selectedRate) renderFare(realDistanceKm, distanceTxt, durationTxt);
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins:      [origin],
      destinations: [destination],
      travelMode:   google.maps.TravelMode.DRIVING,
      unitSystem:   google.maps.UnitSystem.METRIC,
    }, (response, status) => {
      if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
        const element  = response.rows[0].elements[0];
        realDistanceKm = Math.round(element.distance.value / 100) / 10; // metres → km (1 decimal)
        distanceTxt    = element.distance.text;
        durationTxt    = element.duration.text;
      } else {
        // API failed → graceful fallback
        realDistanceKm = 12; distanceTxt = '~12 km'; durationTxt = '';
      }
      if (selectedRate) renderFare(realDistanceKm, distanceTxt, durationTxt);
    });
  }

  // Expose trigger for autocomplete callbacks
  window._triggerFareUpdate = tryCalculateDistance;

  // Also recalculate when user manually edits fields and presses Tab/Enter
  ['rideFrom', 'rideTo'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => {
      if (document.getElementById('rideFrom').value.trim() &&
          document.getElementById('rideTo').value.trim()) {
        // Reset stored places since user may have typed manually
        realDistanceKm = null;
        tryCalculateDistance();
      }
    });
  });

  // ─── Render Fare Card ──────────────────────────────────────────────────────
  // ─── Show fare placeholder with button immediately on vehicle select ─────────
  function showVehicleSelectedState() {
    if (!selectedRate) return;
    fareContent.innerHTML = `
      <div class="fare-row"><span>Vehicle Type</span><span>${selectedType}</span></div>
      <div class="fare-row" style="color:var(--gray-400);font-size:13px;"><span>Calculating fare…</span><span><i class="fa fa-spinner fa-spin"></i></span></div>
      <button type="button" class="btn btn--primary btn--submit" id="confirmBookingBtn" style="margin-top:16px;">Confirm Booking</button>
      <div class="form-error" id="confirmError" style="margin-top:10px;">Please fill in both pickup and drop locations first.</div>
      <div class="booking-success" id="bookingSuccess" style="display:none;"></div>
    `;
    wireConfirmButton();
  }

  function renderFare(distance, distLabel, durationLabel) {
    if (!selectedRate) {
      fareContent.innerHTML = `<div class="fare-empty">Select a vehicle type to see your fare estimate.</div>`;
      return;
    }

    const base         = 30;
    const distanceFare = Math.round(distance * selectedRate);
    const platformFee  = 15;
    const total        = base + distanceFare + platformFee;

    const durationRow = durationLabel
      ? `<div class="fare-row"><span>Estimated Duration</span><span>${durationLabel}</span></div>`
      : '';

    fareContent.innerHTML = `
      <div class="fare-row"><span>Vehicle Type</span><span>${selectedType}</span></div>
      <div class="fare-row"><span>Estimated Distance</span><span>${distLabel || distance + ' km'}</span></div>
      ${durationRow}
      <div class="fare-row"><span>Base Fare</span><span>&#8377;${base}</span></div>
      <div class="fare-row"><span>Distance Fare</span><span>&#8377;${distanceFare}</span></div>
      <div class="fare-row"><span>Platform Fee</span><span>&#8377;${platformFee}</span></div>
      <div class="fare-row total"><span>Total Estimate</span><span>&#8377;${total}</span></div>
      <button type="button" class="btn btn--primary btn--submit" id="confirmBookingBtn">Confirm Booking</button>
      <div class="form-error" id="confirmError" style="margin-top:10px;">Please fill in both pickup and drop locations first.</div>
      <div class="booking-success" id="bookingSuccess" style="display:none; margin-top:12px; padding:12px; background:#e6f9f0; border-radius:8px; color:#1a7a4a; font-weight:600;"></div>
    `;

    wireConfirmButton();
  }

  function wireConfirmButton() {
    const btn = document.getElementById('confirmBookingBtn');
    if (!btn) return;
    
    // Prevent multiple listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async () => {
      const from = document.getElementById('rideFrom').value.trim();
      const to   = document.getElementById('rideTo').value.trim();
      const errorBox = document.getElementById('confirmError');
      const btn      = document.getElementById('confirmBookingBtn');

      if (!from || !to) {
        errorBox.classList.add('show');
        return;
      }
      errorBox.classList.remove('show');

      const token = getToken();
      if (!token) {
        errorBox.textContent = 'Please login to book a ride.';
        errorBox.classList.add('show');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
      }

      newBtn.disabled    = true;
      newBtn.textContent = 'Booking…';

      // Extract coordinates if available
      const places = window._getPlaces ? window._getPlaces() : {};
      let pickupCoords = null;
      let dropCoords   = null;
      if (places.originPlace && places.originPlace.geometry) {
        pickupCoords = {
          lat: places.originPlace.geometry.location.lat(),
          lng: places.originPlace.geometry.location.lng()
        };
      }
      if (places.destinationPlace && places.destinationPlace.geometry) {
        dropCoords = {
          lat: places.destinationPlace.geometry.location.lat(),
          lng: places.destinationPlace.geometry.location.lng()
        };
      }

      try {
        const response = await fetch(`${getBaseUrl()}/api/bookings`, {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup:          from,
            drop:            to,
            vehicleType:     selectedType,
            vehicleCategory: selectedCategory,
            estimatedDistanceKm: realDistanceKm || distance,
            pickupCoords,
            dropCoords,
          }),
        });

        const data = await response.json();

        if (data.success) {
          clearDraft(); // booking confirmed — wipe the saved draft
          localStorage.setItem('vazraa_last_booking', JSON.stringify(data.data));
          btn.textContent = 'Booked! Redirecting to payment…';
          setTimeout(() => { window.location.href = 'payment.html'; }, 800);
        } else {
          errorBox.textContent = data.message || 'Booking failed. Please try again.';
          errorBox.classList.add('show');
          newBtn.disabled    = false;
          newBtn.textContent = 'Confirm Booking';
        }
      } catch (err) {
        errorBox.textContent = 'Network error. Please check your connection and try again.';
        errorBox.classList.add('show');
        newBtn.disabled    = false;
        newBtn.textContent = 'Confirm Booking';
      }
    });
  }

  // ─── Legacy updateFare (kept for vehicle click before distance is known) ────
  function updateFare() {
    if (!selectedRate) {
      fareContent.innerHTML = `<div class="fare-empty">Select a vehicle type to see your fare estimate.</div>`;
      return;
    }
    if (realDistanceKm !== null) {
      renderFare(realDistanceKm, distanceTxt, durationTxt);
    } else {
      tryCalculateDistance();
    }
  }
}

document.addEventListener('DOMContentLoaded', setupBookRidePage);
