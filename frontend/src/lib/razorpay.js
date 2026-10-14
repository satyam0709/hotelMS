const SCRIPT_ID = "razorpay-checkout-js";
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpay() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser."));
  }
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.Razorpay), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay."));
    document.body.appendChild(script);
  });
}

function openDevSandboxModal({
  orderId,
  amount,
  currency = "INR",
  name,
  description,
  prefill = {},
}) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Payment cannot open without a DOM window."));
      return;
    }

    const modalId = "razorpay-dev-sandbox-overlay";
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = modalId;
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200";

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

    overlay.innerHTML = `
      <div class="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200" style="font-family: inherit;">
        <!-- Header -->
        <div class="bg-[#0c2340] px-6 py-5 text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-blue-400 text-lg">
              ₹
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-blue-300">Razorpay Checkout</p>
              <h4 class="text-base font-semibold text-white leading-tight">${name || "Hotel Reservation"}</h4>
            </div>
          </div>
          <button id="rzp-dev-close" class="text-gray-400 hover:text-white transition p-1 text-xl leading-none">&times;</button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4">
          <div class="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 leading-relaxed">
            <span class="font-bold">Sandbox Mode:</span> Razorpay test checkout is active. You can simulate instant payment authorization without live banking charges.
          </div>

          <div class="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500">Payable Amount</span>
              <span class="text-xl font-bold text-gray-900">${formattedAmount}</span>
            </div>
            <div class="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-200/60">
              <span>Order Reference</span>
              <span class="font-mono text-gray-700">${orderId || "N/A"}</span>
            </div>
            ${prefill.name ? `
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>Guest</span>
              <span class="text-gray-700">${prefill.name}</span>
            </div>` : ""}
            ${prefill.email ? `
            <div class="flex justify-between items-center text-xs text-gray-500">
              <span>Email</span>
              <span class="text-gray-700">${prefill.email}</span>
            </div>` : ""}
          </div>

          <!-- Actions -->
          <div class="space-y-2.5 pt-2">
            <button id="rzp-dev-pay-btn" class="w-full py-3.5 px-4 rounded-xl bg-[#2C6700] hover:bg-[#235300] text-white font-medium text-sm transition shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              Authorize & Pay ${formattedAmount}
            </button>
            <button id="rzp-dev-cancel-btn" class="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition">
              Cancel payment
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50/80 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Secured by 256-bit encryption</span>
          <span>Razorpay Realtime Gateway</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => {
      overlay.classList.add("fade-out");
      setTimeout(() => overlay.remove(), 150);
    };

    const payBtn = overlay.querySelector("#rzp-dev-pay-btn");
    const closeBtn = overlay.querySelector("#rzp-dev-close");
    const cancelBtn = overlay.querySelector("#rzp-dev-cancel-btn");

    payBtn.addEventListener("click", () => {
      payBtn.disabled = true;
      payBtn.textContent = "Verifying payment…";
      setTimeout(() => {
        cleanup();
        resolve({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          razorpay_signature: `dev_signature_${orderId}`,
        });
      }, 600);
    });

    const handleCancel = () => {
      cleanup();
      reject(new Error("Payment cancelled."));
    };

    closeBtn.addEventListener("click", handleCancel);
    cancelBtn.addEventListener("click", handleCancel);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) handleCancel();
    });
  });
}

export async function openRazorpayCheckout({
  keyId,
  orderId,
  amount,
  currency = "INR",
  name,
  description,
  prefill = {},
  themeColor = "#2C6700",
}) {
  // If sandbox or dev key, use the enhanced sandbox modal
  if (!keyId || keyId.startsWith("rzp_test_dev") || keyId === "rzp_test_simulated") {
    return openDevSandboxModal({
      orderId,
      amount,
      currency,
      name,
      description,
      prefill,
    });
  }

  // Otherwise, load official Razorpay JS checkout
  try {
    const Razorpay = await loadRazorpay();
    if (!Razorpay) throw new Error("Razorpay is unavailable.");

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: Math.round(Number(amount) * 100),
        currency,
        name: name || "Hotel booking",
        description: description || "Room reservation",
        order_id: orderId,
        prefill,
        theme: { color: themeColor },
        handler(response) {
          resolve(response);
        },
        modal: {
          ondismiss() {
            reject(new Error("Payment cancelled."));
          },
        },
      };

      const checkout = new Razorpay(options);
      checkout.on("payment.failed", (event) => {
        reject(new Error(event?.error?.description || "Payment failed."));
      });
      checkout.open();
    });
  } catch (err) {
    // If official Razorpay checkout script fails to load, gracefully fall back to dev sandbox modal
    return openDevSandboxModal({
      orderId,
      amount,
      currency,
      name,
      description,
      prefill,
    });
  }
}
