/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Razorpay public key id (rzp_test_… or rzp_live_…). Leave empty to keep payments in test mode. */
  readonly VITE_RAZORPAY_KEY_ID?: string;
}
