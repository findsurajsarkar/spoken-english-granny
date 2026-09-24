/** Business details shown on the Contact and policy pages. Fill these in before launch. */
export const BUSINESS = {
  name: 'Spoken English Granny',
  /** Support email shown to customers (required by Razorpay and app stores). */
  email: 'dawaipanikesanghomestay@gmail.com',
  /** WhatsApp / phone for support, purchases and refunds (digits only, with country code). */
  whatsapp: '918868969214',
  phoneDisplay: '+91 88689 69214',
  /** City/state for the governing-law clause. */
  location: 'India',
  lastUpdated: '24 September 2026',
};

/** Public web address of the app (used in share messages). */
export const APP_URL = 'https://findsurajsarkar.github.io/spoken-english-granny/';

/** Direct Android download (sideload APK). Empty = the download button is hidden. */
export const APK_URL = '';

/** Google Analytics 4 measurement ID, e.g. 'G-ABC123XYZ'. Empty = analytics off. */
export const GA_MEASUREMENT_ID = '';

/** Optional Google Form for feedback; when empty, the in-app feedback form sends via WhatsApp/email. */
export const FEEDBACK_FORM_URL = '';

/**
 * REAL feedback from real testers only, used with their permission. The testimonials section on
 * the landing page stays hidden while this list is empty. Never add made-up quotes: fake reviews
 * break consumer-protection law and app-store rules.
 */
export const TESTIMONIALS: Array<{ quote: string; name: string; detail: string }> = [];
