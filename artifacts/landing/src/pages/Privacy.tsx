export default function Privacy() {
  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/landing" className="text-amber-500 text-sm font-medium hover:underline">← Back to FIT✔️</a>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-zinc-900">Privacy Policy</h1>
        <p className="text-sm text-zinc-500 mb-10">Last updated: April 30, 2026</p>

        <div className="space-y-10 text-zinc-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Overview</h2>
            <p>FIT✔️ ("we," "our," or "us") is a personal outfit planning app built by Style Sense. We take your privacy seriously. This policy explains what information we collect, how we use it, and your rights regarding that information.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-zinc-800 mb-1">Location</h3>
                <p>We request your device's location to provide accurate, real-time weather data for your area. This is used solely to generate outfit recommendations. We do not store your location history on our servers.</p>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 mb-1">Photos &amp; Camera</h3>
                <p>If you use the Closet feature, you may upload photos of your clothing items. These images are stored locally on your device or in your account. If you use the GRWM camera feature, camera access is used in real time and recordings are not automatically uploaded anywhere.</p>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 mb-1">Usage Data</h3>
                <p>We collect anonymized usage analytics (such as which features are used and how often) to improve the app. This data is not linked to your identity and cannot be used to identify you.</p>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 mb-1">Account &amp; Preferences</h3>
                <p>Style preferences, wardrobe items, and app settings you configure are stored locally on your device and, if signed in, synced to your account to preserve your experience across sessions.</p>
              </div>
              <div>
                <h3 className="font-semibold text-zinc-800 mb-1">Payment Information</h3>
                <p>If you subscribe to FIT✔️ Pro, payments are processed securely by Stripe. We never see or store your full credit card number. Stripe's privacy policy applies to payment data: <a href="https://stripe.com/privacy" className="text-amber-500 hover:underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To deliver personalized, weather-based outfit recommendations</li>
              <li>To save and display your closet items and style preferences</li>
              <li>To send push notifications for weather alerts or daily fit reminders (only if you opt in)</li>
              <li>To process and manage your Pro subscription</li>
              <li>To improve app features based on aggregated, anonymized usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Data Sharing</h2>
            <p>We do not sell your personal data to third parties. We may share data with the following service providers strictly to operate the app:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Open-Meteo / National Weather Service</strong> — weather data (location sent to retrieve forecast)</li>
              <li><strong>RainViewer</strong> — radar map tiles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Push Notifications</h2>
            <p>If you enable push notifications, we may send you daily outfit reminders or severe weather alerts for your area. You can disable notifications at any time through your device's Settings app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Data Retention</h2>
            <p>Your closet items and preferences are stored for as long as your account is active. If you delete the app or request account deletion, your data is removed from our servers within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Children's Privacy</h2>
            <p>FIT✔️ is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Changes to This Policy</h2>
            <p>We may update this policy from time to time. If we make significant changes, we will notify you through the app or by email. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">Contact Us</h2>
            <p>If you have any questions about this privacy policy or how we handle your data, please contact us at:</p>
            <p className="mt-2 font-medium">fitcheckfeedback@gmail.com</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-zinc-100 text-sm text-zinc-400">
          © 2026 Style Sense. All rights reserved.
        </div>
      </div>
    </div>
  );
}
