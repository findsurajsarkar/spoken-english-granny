/* Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
 *
 * Set VITE_RAZORPAY_KEY_ID in a .env file to take real payments. Without it the app runs in
 * test mode: in development a "test upgrade" button activates Plus locally with no payment,
 * and in a production build the Upgrade buttons say "coming soon".
 *
 * IMPORTANT before going live: Plus status is stored in the browser, so it can be faked.
 * Add a small server (e.g. a Vercel/Netlify function) that creates Razorpay orders and
 * verifies the payment signature, and keep the member list there. */
import { activatePlus, PLANS, type PlanId } from './plan';

const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const paymentsLive = Boolean(KEY_ID);
export const testUpgradeAllowed = !paymentsLive && import.meta.env.DEV;

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
  if (!paymentsLive) {
    if (!testUpgradeAllowed) throw new Error('Payments are coming soon.');
    activatePlus(planId, undefined, true);
    return true;
  }
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
