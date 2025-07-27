import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy - AI Finder',
  description: 'Refund and cancellation policy for AI Finder subscriptions and services.',
}

export default function RefundPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1 className="legal-title">Refund & Cancellation Policy</h1>
          <p className="legal-subtitle">
            Important information about our refund and cancellation terms
          </p>
        </div>
      </div>
      <div className="legal-content">
        <div className="container">
          <div className="legal-card">
            <div className="legal-sections">
              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">1</span>
                  Introduction
                </h2>
                <div className="legal-text">
                  <p>
                    This Refund & Cancellation Policy ("Policy") governs the refund and cancellation terms for AI Finder services provided by us at <a href="https://merlio.app" className="legal-link">https://merlio.app</a>. By purchasing our services, you acknowledge and agree to the terms outlined in this policy.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number legal-number-warning">2</span>
                  No Refund Policy
                </h2>
                
                {/* Important Notice */}
                <div className="legal-notice legal-notice-error">
                  <h3 className="legal-notice-title">
                    IMPORTANT: No Refunds or Cancellations
                  </h3>
                  <p>
                    No refunds or cancellations are allowed after payment has been processed.
                  </p>
                </div>

                <p className="legal-text">
                  All purchases made on AI Finder are final and non-refundable. Once a payment has been processed through our payment gateway (Razorpay), we are unable to provide refunds or process cancellations for any reason, including but not limited to:
                </p>
                
                <div className="legal-grid">
                  <ul className="legal-list">
                    <li>Change of mind or dissatisfaction with the service</li>
                    <li>Technical issues or service interruptions</li>
                    <li>Account suspension or termination</li>
                  </ul>
                  <ul className="legal-list">
                    <li>Unused credits or features</li>
                    <li>Billing errors or duplicate charges</li>
                    <li>Service unavailability or downtime</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">3</span>
                  Subscription Services
                </h2>
                
                <div className="legal-subsection">
                  <h3 className="legal-subtitle">3.1 Micro Top-Up Model</h3>
                  <p className="legal-text">
                    AI Finder operates on a pay-as-you-need micro top-up subscription model where:
                  </p>
                  <div className="legal-notice legal-notice-info">
                    <div className="legal-grid">
                      <ul className="legal-list">
                        <li>Every $1 purchase provides 10 extra tool saves and 1 extra folder</li>
                        <li>Users can purchase repeatedly as needed</li>
                      </ul>
                      <ul className="legal-list">
                        <li>There are no fixed tiers or caps on purchases</li>
                        <li>All purchases are final and non-refundable</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="legal-subsection">
                  <h3 className="legal-subtitle">3.2 Subscription Terms</h3>
                  <p className="legal-text">
                    By purchasing credits or features on our platform:
                  </p>
                  <div className="legal-notice">
                    <ul className="legal-list">
                      <li>You acknowledge that all purchases are final</li>
                      <li>Credits and features are immediately available upon successful payment</li>
                      <li>No refunds will be provided for unused credits or features</li>
                      <li>Credits do not expire unless explicitly stated</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">4</span>
                  Payment Processing
                </h2>
                <div className="legal-notice">
                  <p className="legal-text">
                    All payments are processed securely through <strong>Razorpay</strong>, our trusted payment gateway. Payment processing fees and charges are non-refundable and will not be reimbursed under any circumstances.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">5</span>
                  Service Availability
                </h2>
                <p className="legal-text">
                  While we strive to maintain high service availability, AI Finder may experience temporary downtime or service interruptions due to maintenance, technical issues, or other factors. Such interruptions do not constitute grounds for refunds or cancellations.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">6</span>
                  Account Termination
                </h2>
                <div className="legal-notice legal-notice-warning">
                  <p className="legal-text">
                    If your account is terminated due to violation of our Terms of Service or for any other reason, no refunds will be provided for any remaining credits or unused features.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">7</span>
                  Billing Disputes
                </h2>
                <p className="legal-text">
                  If you believe there has been an error in billing or you have been charged incorrectly, please contact us immediately at <a href="mailto:support@merlio.app" className="legal-link">support@merlio.app</a>. We will investigate the matter and take appropriate action if an error is confirmed.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">8</span>
                  Legal Exceptions
                </h2>
                <p className="legal-text">
                  The only exceptions to our no-refund policy may apply in cases where:
                </p>
                <div className="legal-notice">
                  <ul className="legal-list">
                    <li>Required by applicable law or regulation</li>
                    <li>Mandated by a court order or legal settlement</li>
                    <li>Explicitly stated in a separate written agreement</li>
                  </ul>
                  <p className="legal-text legal-text-small">
                    Such exceptions are rare and will be handled on a case-by-case basis at our sole discretion.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">9</span>
                  Contact Information
                </h2>
                <div className="legal-contact">
                  <p className="legal-text">
                    If you have any questions about this Refund & Cancellation Policy, please contact us at:
                  </p>
                  <div className="legal-contact-info">
                    <p>
                      <span className="legal-label">Email:</span>
                      <a href="mailto:support@merlio.app" className="legal-link">support@merlio.app</a>
                    </p>
                    <p>
                      <span className="legal-label">Website:</span>
                      <a href="https://merlio.app" className="legal-link">https://merlio.app</a>
                    </p>
                  </div>
                  <div className="legal-notice legal-notice-error">
                    <p className="legal-text-small">
                      <strong>Note:</strong> Please note that contacting us does not guarantee a refund, as our policy clearly states that no refunds are provided after payment processing.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">10</span>
                  Changes to This Policy
                </h2>
                <p className="legal-text">
                  We reserve the right to modify this Refund & Cancellation Policy at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after any changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">11</span>
                  Acknowledgment
                </h2>
                <div className="legal-notice legal-notice-info">
                  <p className="legal-text">
                    By making a purchase on AI Finder, you acknowledge that you have read, understood, and agree to this Refund & Cancellation Policy. You understand that all purchases are final and non-refundable.
                  </p>
                </div>
              </section>

              <div className="legal-footer">
                <p className="legal-updated">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 