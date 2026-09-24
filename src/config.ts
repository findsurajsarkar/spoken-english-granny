/** Business details shown on the Contact and policy pages. Fill these in before launch. */
export const BUSINESS = {
  name: 'Spoken English Granny',
  /** Support email shown to customers (required by Razorpay and app stores). */
  email: '',
  /** City/state for the governing-law clause. */
  location: 'India',
  lastUpdated: '24 September 2026',
};

/** Public web address of the app (used in share messages). */
export const APP_URL = 'https://findsurajsarkar.github.io/spoken-english-granny/';

/** Play Store / App Store links: fill in once the apps are published (empty = "coming soon"). */
export const STORE_LINKS = {
  playStore: '',
  appStore: '',
  microsoftStore: '',
};

/**
 * REAL feedback from real testers only, used with their permission. The testimonials section on
 * the landing page stays hidden while this list is empty. Never add made-up quotes: fake reviews
 * break consumer-protection law and app-store rules.
 */
export const TESTIMONIALS: Array<{ quote: string; name: string; detail: string }> = [];
