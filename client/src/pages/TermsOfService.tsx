/**
 * A1 Marine Care — Terms of Service
 * Design: Dark luxury marine aesthetic
 * Colors: #000000 bg, #2B2B2B cards, #00FFFF accent
 */

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/a1-logo.png" alt="A1 Marine Care" className="h-8 w-auto" />
          </a>
          <a
            href="/"
            className="text-sm text-[#00FFFF] hover:text-[#00FFFF]/80 transition-colors"
          >
            ← Back to Quote
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
            <p className="text-sm text-white/40">Last updated: March 2026</p>
          </div>

          {/* Introduction */}
          <section className="space-y-3">
            <p className="text-white/70 leading-relaxed">
              Welcome to A1 Marine Care. By using our online quote portal and submitting a deposit, you agree to the following terms and conditions. Please read them carefully before proceeding.
            </p>
          </section>

          {/* Credit Card Authorization */}
          <section className="space-y-3 rounded-2xl border border-[#00FFFF]/20 bg-[#00FFFF]/[0.03] p-6">
            <h2 className="text-lg font-semibold text-[#00FFFF]">Credit Card Authorization & Deposit</h2>
            <p className="text-white/70 leading-relaxed">
              By providing your credit card information and submitting a deposit through our secure checkout, you authorize A1 Marine Care to charge the stated deposit amount to your card. This deposit:
            </p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Secures your service appointment and confirms your booking intent.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Is fully applied toward your final service invoice — it is not an additional fee.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Is non-refundable if you cancel within 48 hours of your scheduled service date.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>May be refunded at our discretion if you cancel with more than 48 hours' notice.</span>
              </li>
            </ul>
            <p className="text-white/50 text-sm leading-relaxed">
              All payments are processed securely through Stripe. A1 Marine Care does not store your full credit card details on our servers.
            </p>
          </section>

          {/* Quote Estimates */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Quote Estimates</h2>
            <p className="text-white/70 leading-relaxed">
              The instant quote provided through our portal is an estimate based on the information you supply. The final price may differ from the estimate following an on-site inspection of your vessel. Factors that may affect the final price include, but are not limited to:
            </p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Actual boat condition upon inspection (heavy oxidation, mold, damage, etc.).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Inaccurate boat length or type provided at the time of quoting.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span>Additional services identified as necessary during the service visit.</span>
              </li>
            </ul>
            <p className="text-white/50 text-sm">
              We will always communicate any price adjustments before proceeding with additional work.
            </p>
          </section>

          {/* Service Scheduling */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Service Scheduling</h2>
            <p className="text-white/70 leading-relaxed">
              After your deposit is processed, a member of our team will contact you to confirm your service date and time. Scheduling is subject to availability and weather conditions. We reserve the right to reschedule services due to unsafe weather or other circumstances beyond our control.
            </p>
          </section>

          {/* Cancellation Policy */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Cancellation & Rescheduling</h2>
            <p className="text-white/70 leading-relaxed">
              We understand that plans change. Our cancellation policy is as follows:
            </p>
            <ul className="space-y-2 text-white/60 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span><strong className="text-white/80">More than 48 hours notice:</strong> Full deposit refund or transfer to a rescheduled date.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span><strong className="text-white/80">Less than 48 hours notice:</strong> Deposit is forfeited. Rescheduling may be available at our discretion.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00FFFF] mt-0.5">•</span>
                <span><strong className="text-white/80">No-show:</strong> Deposit is forfeited and a rebooking fee may apply.</span>
              </li>
            </ul>
          </section>

          {/* Liability */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Liability</h2>
            <p className="text-white/70 leading-relaxed">
              A1 Marine Care takes great care in servicing your vessel. However, we are not liable for pre-existing damage, wear, or defects discovered during the service. We will document the condition of your boat before beginning any work and notify you of any concerns.
            </p>
          </section>

          {/* Privacy */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              Your personal information (name, email, phone number) is collected solely for the purpose of providing our services and communicating with you about your booking. We do not sell or share your information with third parties, except as required to process your payment (Stripe) or schedule your appointment.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-3 rounded-2xl border border-white/10 bg-[#2B2B2B] p-6">
            <h2 className="text-lg font-semibold text-white">Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-1 text-sm text-white/60">
              <p>Email: <a href="mailto:contact@a1marinecare.ca" className="text-[#00FFFF] hover:text-[#00FFFF]/80">contact@a1marinecare.ca</a></p>
              <p>Phone: <a href="tel:+17059961010" className="text-[#00FFFF] hover:text-[#00FFFF]/80">(705) 996-1010</a></p>
              <p>Service Area: Georgian Bay, Lake Simcoe, and Muskoka, Ontario</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0a0a0a] mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-xs text-white/20">
            &copy; 2026 A1 Marine Care. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
