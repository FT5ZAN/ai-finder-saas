import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions - AI Finder',
  description: 'Terms and conditions for using AI Finder - AI tools discovery platform.',
}

export default function TermsAndConditions() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1 className="legal-title">Terms & Conditions</h1>
          <p className="legal-subtitle">
            Terms and conditions for using AI Finder - AI tools discovery platform
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
                  Acceptance of Terms
                </h2>
                <div className="legal-text">
                  <p>
                    By accessing and using AI Finder ("Service") at <a href="https://merlio.app" className="legal-link">https://merlio.app</a>, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">2</span>
                  Description of Service
                </h2>
                <p className="legal-text">
                  AI Finder is an AI tools discovery platform that allows users to:
                </p>
                <div className="legal-grid">
                  <ul className="legal-list">
                    <li>Discover and explore various AI tools and applications</li>
                    <li>Save and organize AI tools in personal folders</li>
                    <li>Access curated collections of AI tools by category</li>
                  </ul>
                  <ul className="legal-list">
                    <li>Purchase additional features and storage through micro top-ups</li>
                    <li>Receive personalized recommendations and updates</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">3</span>
                  User Accounts
                </h2>
                
                <div className="legal-services">
                  <div className="legal-service-card">
                    <h3 className="legal-service-title">3.1 Account Creation</h3>
                    <p className="legal-text">
                      To access certain features of AI Finder, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">3.2 Account Security</h3>
                    <p className="legal-text">
                      You are responsible for safeguarding the password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">3.3 Account Termination</h3>
                    <p className="legal-text">
                      We reserve the right to terminate or suspend your account at any time for violations of these Terms or for any other reason at our sole discretion.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">4</span>
                  Subscription and Payment Terms
                </h2>
                
                <div className="legal-subsection">
                  <h3 className="legal-subtitle">4.1 Micro Top-Up Model</h3>
                  <p className="legal-text">
                    AI Finder operates on a pay-as-you-need micro top-up subscription model:
                  </p>
                  <div className="legal-notice legal-notice-info">
                    <div className="legal-grid">
                      <ul className="legal-list">
                        <li>Every $1 purchase provides 10 extra tool saves and 1 extra folder</li>
                        <li>Users can purchase repeatedly as needed</li>
                      </ul>
                      <ul className="legal-list">
                        <li>No fixed tiers or caps on purchases</li>
                        <li>All purchases are final and non-refundable</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="legal-subsection">
                  <h3 className="legal-subtitle">4.2 Payment Processing</h3>
                  <p className="legal-text">
                    All payments are processed securely through <strong>Razorpay</strong>. By making a purchase, you authorize us to charge your payment method for the specified amount.
                  </p>
                </div>

                <div className="legal-subsection">
                  <h3 className="legal-subtitle">4.3 No Refunds</h3>
                  <div className="legal-notice legal-notice-error">
                    <p className="legal-text">
                      All purchases are final and non-refundable. Please refer to our <a href="/legal/refund-policy" className="legal-link">Refund & Cancellation Policy</a> for complete details.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">5</span>
                  Acceptable Use Policy
                </h2>
                <p className="legal-text">You agree not to use the Service to:</p>
                <div className="legal-grid">
                  <ul className="legal-list">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others</li>
                    <li>Upload or transmit malicious code, viruses, or harmful content</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                  </ul>
                  <ul className="legal-list">
                    <li>Interfere with or disrupt the Service</li>
                    <li>Use the Service for any commercial purpose without our written consent</li>
                    <li>Impersonate another person or entity</li>
                    <li>Collect or store personal data of other users without consent</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">6</span>
                  Intellectual Property Rights
                </h2>
                
                <div className="legal-services">
                  <div className="legal-service-card">
                    <h3 className="legal-service-title">6.1 Our Rights</h3>
                    <p className="legal-text">
                      The Service and its original content, features, and functionality are and will remain the exclusive property of AI Finder and its licensors. The Service is protected by copyright, trademark, and other laws.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">6.2 User Content</h3>
                    <p className="legal-text">
                      You retain ownership of any content you create or upload to the Service. By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content in connection with the Service.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">6.3 Third-Party Content</h3>
                    <p className="legal-text">
                      The Service may contain links to third-party websites and tools. We are not responsible for the content or practices of any third-party websites or services.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">7</span>
                  Privacy and Data Protection
                </h2>
                <div className="legal-notice legal-notice-info">
                  <p className="legal-text">
                    Your privacy is important to us. Please review our <a href="/legal/privacy-policy" className="legal-link">Privacy Policy</a>, which also governs your use of the Service, to understand our practices regarding the collection and use of your personal information.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">8</span>
                  Service Availability
                </h2>
                <p className="legal-text">
                  We strive to maintain high service availability but do not guarantee uninterrupted access to the Service. We may temporarily suspend or restrict access to the Service for maintenance, updates, or other operational reasons.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">9</span>
                  Disclaimers and Limitations
                </h2>
                
                <div className="legal-services">
                  <div className="legal-service-card legal-notice-warning">
                    <h3 className="legal-service-title">9.1 Service Disclaimer</h3>
                    <p className="legal-text">
                      The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                    </p>
                  </div>

                  <div className="legal-service-card legal-notice-error">
                    <h3 className="legal-service-title">9.2 Limitation of Liability</h3>
                    <p className="legal-text">
                      In no event shall AI Finder be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">10</span>
                  Indemnification
                </h2>
                <p className="legal-text">
                  You agree to defend, indemnify, and hold harmless AI Finder and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">11</span>
                  Governing Law
                </h2>
                <p className="legal-text">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AI Finder operates, without regard to its conflict of law provisions.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">12</span>
                  Dispute Resolution
                </h2>
                <p className="legal-text">
                  Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the relevant arbitration association, unless prohibited by applicable law.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">13</span>
                  Changes to Terms
                </h2>
                <p className="legal-text">
                  We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">14</span>
                  Severability
                </h2>
                <p className="legal-text">
                  If any provision of these Terms is held to be invalid or unenforceable, such provision shall be struck and the remaining provisions shall be enforced to the fullest extent possible.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">15</span>
                  Entire Agreement
                </h2>
                <div className="legal-notice">
                  <p className="legal-text">
                    These Terms, together with our <a href="/legal/privacy-policy" className="legal-link">Privacy Policy</a> and <a href="/legal/refund-policy" className="legal-link">Refund & Cancellation Policy</a>, constitute the entire agreement between you and AI Finder regarding the use of the Service.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">16</span>
                  Contact Information
                </h2>
                <div className="legal-contact">
                  <p className="legal-text">
                    If you have any questions about these Terms & Conditions, please contact us at:
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