export default function Support() {
  return (
    <div className="min-h-screen bg-white text-zinc-800 font-sans">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <a href="/landing" className="text-amber-500 text-sm font-medium hover:underline">← Back to FIT Check</a>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-zinc-900">FIT Check Support</h1>
        <p className="text-sm text-zinc-500 mb-10">We're here to help.</p>

        <div className="space-y-10 text-zinc-700 leading-relaxed">

          <section>
            <p className="text-lg">
              Need help with FIT Check? Contact us for subscription issues, account questions,
              outfit recommendations, travel planning assistance, or technical support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">Contact</h2>
            <a
              href="mailto:fitcheckfeedback@gmail.com"
              className="text-amber-500 font-medium hover:underline"
            >
              fitcheckfeedback@gmail.com
            </a>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-6">FAQ</h2>
            <div className="space-y-6">

              <div className="border-b border-zinc-100 pb-6">
                <h3 className="font-semibold text-zinc-900 mb-2">How do I restore purchases?</h3>
                <p>Open the app and tap "Restore Purchases" on the subscription page.</p>
              </div>

              <div className="border-b border-zinc-100 pb-6">
                <h3 className="font-semibold text-zinc-900 mb-2">How do I cancel my subscription?</h3>
                <p>Subscriptions can be managed through your Apple ID subscription settings.</p>
              </div>

              <div className="border-b border-zinc-100 pb-6">
                <h3 className="font-semibold text-zinc-900 mb-2">How do I report a bug?</h3>
                <p>
                  Email{" "}
                  <a href="mailto:fitcheckfeedback@gmail.com" className="text-amber-500 hover:underline">
                    fitcheckfeedback@gmail.com
                  </a>{" "}
                  with screenshots and device information.
                </p>
              </div>

            </div>
          </section>

          <section className="pt-4 flex items-center gap-6 text-sm">
            <a
              href="/landing/privacy"
              className="text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
            >
              Terms of Use
            </a>
          </section>

        </div>
      </div>
    </div>
  );
}
