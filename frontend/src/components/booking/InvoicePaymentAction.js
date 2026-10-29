"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, CheckCircle, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { createPaymentOrder, verifyPayment } from "@/lib/api/booking";
import { openRazorpayCheckout } from "@/lib/razorpay";

export default function InvoicePaymentAction({ invoice, lookup, brandName }) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if booking is payable online
  const isPayableStatus = ["PENDING_PAYMENT", "PENDING"].includes(invoice?.status);
  const isUnpaid = invoice?.paymentStatus !== "PAID";
  const isOnlineMethod = invoice?.paymentMethod === "ONLINE";
  const isExpired = invoice?.expiresAt && new Date(invoice.expiresAt) <= new Date();

  const canPay = isOnlineMethod && isPayableStatus && isUnpaid && !isExpired;

  async function handlePay() {
    setPaying(true);
    setError("");
    try {
      const order = await createPaymentOrder({
        bookingRef: invoice.bookingRef,
        email: lookup.email,
        phone: lookup.phone,
      });

      const rpRes = await openRazorpayCheckout({
        keyId: order.keyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: brandName || "Hotel booking",
        description: `Booking ${invoice.bookingRef}`,
        prefill: {
          name: invoice.guest?.fullName,
          email: lookup.email || invoice.guest?.email || undefined,
          contact: lookup.phone || invoice.guest?.phone || undefined,
        },
      });

      await verifyPayment({
        bookingRef: invoice.bookingRef,
        razorpayOrderId: rpRes.razorpay_order_id,
        razorpayPaymentId: rpRes.razorpay_payment_id,
        razorpaySignature: rpRes.razorpay_signature,
        email: lookup.email,
        phone: lookup.phone,
      });

      setSuccess(true);
      // Refresh current route to fetch latest invoice status with updated payments
      router.refresh();
    } catch (err) {
      if (err?.message === "Payment cancelled.") {
        setError("Payment was cancelled. You can try again while the hold is active.");
      } else {
        setError(err instanceof ApiError ? err.message : err?.message || "Payment failed.");
      }
    } finally {
      setPaying(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700">
        <CheckCircle className="size-4 shrink-0 text-emerald-600" />
        <span>Payment successful! The invoice has been updated.</span>
      </div>
    );
  }

  if (!canPay) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handlePay}
          disabled={paying}
          size="md"
          className="shadow-sm"
        >
          <CreditCard className="size-4" />
          {paying ? "Opening Razorpay…" : "Pay now"}
        </Button>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
