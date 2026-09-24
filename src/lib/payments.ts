/* Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
 *
 * Set VITE_RAZORPAY_KEY_ID (a GitHub repository secret for the live site) to take card/UPI
 * payments in the app. Without it, customers buy on WhatsApp and get an activation code
 * (see src/plusCodes.ts).
 *
 * IMPORTANT before going live: Plus status is stored in the browser, so it can be faked.
 * Add a small server (e.g. a Vercel/Netlify function) that creates Razorpay orders and
 * verifies the payment signature, and keep the member list there. */
import { activatePlus, PLANS, type PlanId } from './plan';

const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const paymentsLive = Boolean(KEY_ID);

function loadCheckout(): Promise<void> {
  if ((window as any).Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load the payment window. Check your internet and try again.'));
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout; resolves true when payment succeeded and Plus is active. */
export async function buyPlus(planId: PlanId, prefill?: { name?: string }): Promise<boolean> {
  const plan = PLANS[planId];
  if (!paymentsLive) throw new Error('Online payments are not set up yet.');
  await loadCheckout();
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: KEY_ID,
      amount: plan.price * 100, // paise
      currency: 'INR',
      name: 'Spoken English Granny',
      description: plan.name,
      image: new URL('icon.svg', window.location.href).toString(),
      prefill,
      theme: { color: '#b8322a' },
      handler: (resp: { razorpay_payment_id: string }) => {
        activatePlus(planId, resp.razorpay_payment_id);
        resolve(true);
      },
      modal: { ondismiss: () => resolve(false) },
    });
    rzp.on('payment.failed', (r: any) => reject(new Error(r?.error?.description || 'The payment did not go through.')));
    rzp.open();
  });
}
