/**
 * payment-result.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles the payment result page:
 *   1. Reads bookingId from URL params (set by Cashfree return_url)
 *   2. Calls backend GET /api/payments/verify/:bookingId
 *   3. Backend queries Cashfree server-side and returns the REAL status
 *   4. Shows success / failure / retry UI based on verified status
 *
 * SECURITY: Never trusts the URL params alone. Backend verification is mandatory.
 */

(function () {
  'use strict';

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getBaseUrl() {
    return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'http://localhost:5000';
  }

  function getToken() {
    return localStorage.getItem('vazraa_token') || '';
  }

  function formatDate(d) {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  }

  // ─── UI State Switching ───────────────────────────────────────────────────
  function showChecking() {
    document.getElementById('stateChecking').style.display = '';
    document.getElementById('stateSuccess').style.display  = 'none';
    document.getElementById('stateFailure').style.display  = 'none';
  }

  function showSuccess(data) {
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem('vazraa_last_booking') || '{}'); } catch {}

    const updatedBooking = {
      ...existing,
      ...data,
      bookingId: data.bookingId || existing.bookingId || existing._id,
      paymentStatus: 'Paid',
    };
    localStorage.setItem('vazraa_last_booking', JSON.stringify(updatedBooking));

    const bookingId = updatedBooking.bookingId || data.bookingId || '';
    const redirectUrl = `booking-confirm.html${bookingId ? '?bookingId=' + bookingId : ''}`;
    window.location.href = redirectUrl;
  }

  function showFailure(data, status) {
    document.getElementById('stateChecking').style.display = 'none';
    document.getElementById('stateSuccess').style.display  = 'none';
    document.getElementById('stateFailure').style.display  = '';

    const statusLabel = (status || 'Pending');
    const isPending   = statusLabel.toLowerCase() === 'pending';

    // Update title/subtitle
    const titleEl = document.getElementById('failureTitle');
    const subtitleEl = document.getElementById('failureSubtitle');
    if (titleEl) titleEl.textContent = isPending ? 'Payment Not Completed' : 'Payment Failed';
    if (subtitleEl) subtitleEl.textContent = isPending
      ? 'The payment was not completed or was cancelled.'
      : 'The payment could not be processed.';

    // Update status pill
    const pillEl = document.getElementById('failureStatusPill');
    const pillTextEl = document.getElementById('failureStatusText');
    if (pillEl) {
      pillEl.className = `status-pill ${isPending ? 'pending' : 'failed'}`;
      const icon = pillEl.querySelector('i');
      if (icon) icon.className = isPending ? 'fa fa-clock' : 'fa fa-times-circle';
    }
    if (pillTextEl) pillTextEl.textContent = statusLabel;
  }

  function showError(message) {
    document.getElementById('stateChecking').innerHTML = `
      <div style="text-align:center; padding: 20px 10px;">
        <div style="font-size:40px; margin-bottom:12px;">⚠️</div>
        <h3 style="color:#1b2434; margin-bottom:8px;">Verification Error</h3>
        <p style="color:#8993a4; margin-bottom:20px; font-size:14px;">${message}</p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <a href="my-rides.html" class="btn btn--outline" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fa fa-route"></i> My Rides
          </a>
          <a href="index.html" class="btn btn--primary" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fa fa-home"></i> Home
          </a>
        </div>
      </div>`;
  }

  // ─── Retry Payment ────────────────────────────────────────────────────────
  window.retryPayment = function () {
    const params   = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    if (!bookingId) {
      // No bookingId — send back to book-ride
      window.location.href = 'book-ride.html';
      return;
    }

    // Redirect to payment page with bookingId in URL (payment.js will pick it up)
    window.location.href = `payment.html?bookingId=${bookingId}`;
  };

  // ─── Verify Payment via Backend ───────────────────────────────────────────
  async function verifyPayment(bookingId) {
    const token = getToken();
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    let response, result;
    try {
      response = await fetch(`${getBaseUrl()}/api/payments/verify/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
      });
      result = await response.json();
    } catch (networkErr) {
      showError('Could not reach the server. Please check your connection and <a href="">refresh</a>.');
      return;
    }

    if (!response.ok || !result.success) {
      const msg = result?.message || 'Unable to verify payment status.';
      showError(msg);
      return;
    }

    const data   = result.data;
    const status = data.paymentStatus; // 'Paid' | 'Pending' | 'Failed'

    if (status === 'Paid') {
      showSuccess(data);
    } else {
      showFailure(data, status);
    }
  }

  // ─── Handle Already-Paid Redirect (from payment.js) ──────────────────────
  function handleAlreadyPaid(bookingId) {
    // Fetch booking data from localStorage for display
    let bookingData = null;
    try { bookingData = JSON.parse(localStorage.getItem('vazraa_last_booking') || 'null'); } catch {}

    const data = bookingData ? {
      bookingNumber: bookingData.bookingNumber,
      pickup:        bookingData.pickup || bookingData.booking?.pickup,
      drop:          bookingData.drop   || bookingData.booking?.drop,
      vehicleType:   bookingData.vehicleType || bookingData.booking?.vehicleType,
      amount:        bookingData.estimatedFare || bookingData.booking?.estimatedFare,
    } : {};

    // Still verify server-side even if status=already_paid
    verifyPayment(bookingId);
  }

  // ─── Page Init ────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (!getToken()) {
      window.location.href = 'login.html';
      return;
    }

    const params    = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    const orderId   = params.get('order_id');    // passed by Cashfree return_url
    const statusParam = params.get('status');    // internal: 'already_paid'

    if (!bookingId) {
      showError('No booking ID found. Please go to My Rides to check your payment status.');
      return;
    }

    // Show checking state
    showChecking();

    if (statusParam === 'already_paid') {
      handleAlreadyPaid(bookingId);
    } else {
      // Always verify via backend — never trust URL params alone
      verifyPayment(bookingId);
    }
  });

})();
