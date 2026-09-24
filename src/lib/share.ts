import { APP_URL } from '../config';

/** Uses the phone's share sheet when available, otherwise opens WhatsApp. */
export async function shareText(text: string) {
  const full = `${text} ${APP_URL}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Spoken English Granny', text, url: APP_URL });
      return;
    } catch {
      /* cancelled — fall through to nothing */
      return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(full)}`, '_blank', 'noopener');
}
