/**
 * payment.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Handles the Vazraa payment page:
 *   1. Reads booking from localStorage
 *   2. Calls backend POST /api/payments/create-order (authenticated)
 *   3. Receives paymentSessionId from backend
 *   4. Opens Cashfree Checkout SDK
 *
 * SECURITY: The Cashfree Client Secret is NEVER present in this file.
 * Only the paymentSessionId (a temporary token) is used here.
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

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const initLoading   = document.getElementById('initLoading');
  const paymentBody   = document.getElementById('paymentBody');
  const paymentError  = document.getElementById('paymentError');
  const paymentErrorText = document.getElementById('paymentErrorText');
  const payBtn        = document.getElementById('payBtn');

  // ─── State ────────────────────────────────────────────────────────────────
  let currentPaymentSessionId = null;
  let currentBookingId        = null;

  // ─── Show/hide helpers ────────────────────────────────────────────────────
  function showError(msg) {
    paymentErrorText.textContent = msg || 'An error occurred. Please try again.';
    paymentError.classList.add('show');
  }

  function hideError() {
    paymentError.classList.remove('show');
  }

  function setPayBtnLoading(loading) {
    if (loading) {
      payBtn.disabled = true;
      payBtn.classList.add('loading');
      payBtn.querySelector('.btn-icon') && (payBtn.querySelector('.btn-icon').style.display = 'none');
    } else {
      payBtn.disabled = false;
      payBtn.classList.remove('loading');
      payBtn.querySelector('.btn-icon') && (payBtn.querySelector('.btn-icon').style.display = '');
    }
  }

  // ─── Populate booking details from localStorage ────────────────────────────
  function populateBookingDetails(bookingData) {
    const bk = bookingData || {};

    const refEl = document.getElementById('bookingRefNumber');
    if (refEl) refEl.textContent = bk.bookingNumber || '—';

    const pickupEl = document.getElementById('payPickup');
    if (pickupEl) pickupEl.textContent = bk.pickup || bk.booking?.pickup || '—';

    const dropEl = document.getElementById('payDrop');
    if (dropEl) dropEl.textContent = bk.drop || bk.booking?.drop || '—';

    const vehicleEl = document.getElementById('payVehicle');
    if (vehicleEl) vehicleEl.textContent = bk.vehicleType || bk.booking?.vehicleType || '—';

    const dateEl = document.getElementById('payDateTime');
    if (dateEl) {
      const date = bk.scheduledDate || bk.booking?.scheduledDate;
      const time = bk.scheduledTime || bk.booking?.scheduledTime;
      dateEl.textContent = [formatDate(date), time].filter(Boolean).join(' at ') || '—';
    }

    const amountEl = document.getElementById('payAmount');
    if (amountEl) {
      const fare = bk.estimatedFare || bk.booking?.estimatedFare;
      amountEl.textContent = fare != null ? `₹${fare}` : '₹—';
    }
  }

  // ─── Populate from backend response (authoritative amounts) ───────────────
  function populateFromBackend(data) {
    const refEl = document.getElementById('bookingRefNumber');
    if (refEl && data.bookingNumber) refEl.textContent = data.bookingNumber;

    const amountEl = document.getElementById('payAmount');
    if (amountEl && data.amount != null) amountEl.textContent = `₹${data.amount}`;

    if (data.pickup) {
      const el = document.getElementById('payPickup');
      if (el) el.textContent = data.pickup;
    }
    if (data.drop) {
      const el = document.getElementById('payDrop');
      if (el) el.textContent = data.drop;
    }
    if (data.vehicleType) {
      const el = document.getElementById('payVehicle');
      if (el) el.textContent = data.vehicleType;
    }
    if (data.scheduledDate || data.scheduledTime) {
      const el = document.getElementById('payDateTime');
      if (el) el.textContent = [formatDate(data.scheduledDate), data.scheduledTime].filter(Boolean).join(' at ') || '—';
    }
  }

  // ─── Call backend to create Cashfree payment order ────────────────────────
  async function createPaymentOrder(bookingId) {
    const token = getToken();
    if (!token) {
      window.location.href = 'login.html';
      return null;
    }

    const response = await fetch(`${getBaseUrl()}/api/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    });

    const result = await response.json();
    return { ok: response.ok, data: result };
  }

  // ─── Main: Initiate Cashfree Checkout ────────────────────────────────────
  window.initiatePayment = async function () {
    if (!currentPaymentSessionId || !currentBookingId) {
      showError('Payment session not ready. Please refresh the page.');
      return;
    }

    hideError();
    setPayBtnLoading(true);

    try {
      // Initialize Cashfree with sandbox mode
      // MODE IS HARDCODED TO SANDBOX — change to "production" for live
      const cashfree = Cashfree({ mode: 'sandbox' });

      // Open Cashfree Checkout
      // redirectTarget: "_self" means Cashfree replaces the current tab
      // Cashfree will redirect back to CASHFREE_RETURN_URL after payment
      await cashfree.checkout({
        paymentSessionId: currentPaymentSessionId,
        redirectTarget:   '_self',
      });

      // Note: execution may not reach here if Cashfree redirects immediately
    } catch (err) {
      console.error('[Payment] Cashfree checkout error:', err);
      showError('Payment gateway error. Please try again.');
      setPayBtnLoading(false);
    }
  };

  // ─── Page Initialization ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication first
    if (!getToken()) {
      window.location.href = 'login.html';
      return;
    }

    // Read booking from localStorage
    let bookingData = null;
    try {
      bookingData = JSON.parse(localStorage.getItem('vazraa_last_booking') || 'null');
    } catch {
      bookingData = null;
    }

    // Also check URL params (e.g. if user navigated here directly with ?bookingId=)
    const urlParams = new URLSearchParams(window.location.search);
    const urlBookingId = urlParams.get('bookingId');

    const bookingId = urlBookingId ||
      bookingData?.bookingId ||
      bookingData?.booking?._id ||
      bookingData?._id;

    if (!bookingId) {
      // No booking found — show error and link to book-ride
      initLoading.innerHTML = `
        <div style="text-align:center; padding: 20px;">
          <div style="font-size:40px; margin-bottom:12px;">⚠️</div>
          <h3 style="color:#1b2434; margin-bottom:8px;">No Booking Found</h3>
          <p style="color:#8993a4; margin-bottom:20px;">We couldn't find a booking to pay for.</p>
          <a href="book-ride.html" class="btn btn--primary" style="display:inline-flex;">Book a Ride</a>
        </div>`;
      return;
    }

    currentBookingId = bookingId;

    // Pre-populate UI with localStorage data while backend call is in progress
    if (bookingData) {
      populateBookingDetails(bookingData);
    }

    // Call backend to create payment order
    let result;
    try {
      result = await createPaymentOrder(bookingId);
    } catch (networkErr) {
      initLoading.innerHTML = '';
      initLoading.style.display = 'none';
      paymentBody.style.display = 'block';
      if (bookingData) populateBookingDetails(bookingData);
      showError('Network error. Please check your connection and try again.');
      return;
    }

    // Hide loader, show body
    initLoading.style.display = 'none';
    paymentBody.style.display = 'block';

    if (!result || !result.ok || !result.data?.success) {
      const apiMsg = result?.data?.message;

      // If already paid — redirect to success page
      if (result?.data?.data?.alreadyPaid) {
        window.location.href = `payment-result.html?bookingId=${bookingId}&status=already_paid`;
        return;
      }

      if (bookingData) populateBookingDetails(bookingData);
      showError(apiMsg || 'Unable to start payment. Please try again.');
      return;
    }

    // Success — populate authoritative data from backend
    const orderData = result.data.data;
    currentPaymentSessionId = orderData.paymentSessionId;

    populateFromBackend(orderData);
  });

})();
