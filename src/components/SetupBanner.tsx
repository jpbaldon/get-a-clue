import { firebaseConfigured } from '@/lib/firebase';

export function SetupBanner() {
  if (firebaseConfigured()) return null;

  return (
    <section className="rounded-2xl border border-gold/70 bg-gold/10 p-6 text-cream">
      <h2 className="mb-3 text-2xl font-black text-gold">Firebase setup needed</h2>
      <p className="mb-3">
        Copy <code>.env.example</code> to <code>.env.local</code>, create a Firebase web app,
        and fill in the public Firebase values. Enable Google and anonymous auth, then deploy
        the included Firestore and Realtime Database rules.
      </p>
      <p className="text-sm text-cream/80">
        The app stays client-only and will not initialize Firebase until those values exist.
      </p>
    </section>
  );
}
