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
}
