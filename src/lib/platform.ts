/* Which package the app is running in. Store builds open the site with ?app=play / ?app=ios /
 * ?app=msstore (set as the start URL when packaging, see STORE.md); we remember it for the device.
 *
 * Google Play and the App Store don't allow selling digital upgrades through outside payment
 * providers like Razorpay inside their apps, so store builds hide Plus purchases. */

const KEY = 'granny.channel.v1';
export type Channel = 'web' | 'play' | 'ios' | 'msstore';

function detect(): Channel {
  try {
    const p = new URLSearchParams(window.location.search).get('app');
    if (p === 'play' || p === 'ios' || p === 'msstore') {
      localStorage.setItem(KEY, p);
      return p;
    }
    if (document.referrer.startsWith('android-app://')) {
      localStorage.setItem(KEY, 'play');
      return 'play';
    }
    return (localStorage.getItem(KEY) as Channel) || 'web';
  } catch {
    return 'web';
  }
}

export const channel: Channel = typeof window !== 'undefined' ? detect() : 'web';

/** Plus can be bought here (website and Microsoft Store, which allows third-party payments). */
export const canSellHere = channel === 'web' || channel === 'msstore';
