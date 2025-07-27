import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - AI Finder',
  description: 'Privacy Policy for AI Finder - Learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-header">
        <div className="container">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            Learn how AI Finder collects, uses, and protects your personal information
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
                    Welcome to AI Finder ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at <a href="https://merlio.app" className="legal-link">https://merlio.app</a> and use our AI tools discovery platform.
                  </p>
                  <p>
                    By using our service, you agree to the collection and use of information in accordance with this policy.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">2</span>
                  Information We Collect
                </h2>
                
                <div className="legal-subsection">
                  <h3 className="legal-subtitle">2.1 Personal Information</h3>
                  <p className="legal-text">
                    We may collect personal information that you voluntarily provide to us, including:
                  </p>
                  <ul className="legal-list">
                    <li>Name and email address when you create an account</li>
                    <li>Payment information when you subscribe to our services</li>
                    <li>Profile information and preferences</li>
                    <li>Communication preferences and feedback</li>
                  </ul>
                </div>

                <div className="legal-subsection">
                  <h3 className="legal-subtitle">2.2 Automatically Collected Information</h3>
                  <p className="legal-text">
                    We automatically collect certain information when you visit our website, including:
                  </p>
                  <ul className="legal-list">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring website information</li>
                    <li>Usage patterns and interactions with our platform</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">3</span>
                  How We Use Your Information
                </h2>
                <p className="legal-text">
                  We use the collected information for the following purposes:
                </p>
                <div className="legal-grid">
                  <ul className="legal-list">
                    <li>To provide and maintain our AI tools discovery service</li>
                    <li>To process payments and manage subscriptions</li>
                    <li>To personalize your experience and provide relevant recommendations</li>
                    <li>To communicate with you about our services and updates</li>
                  </ul>
                  <ul className="legal-list">
                    <li>To improve our website and services</li>
                    <li>To comply with legal obligations</li>
                    <li>To prevent fraud and ensure security</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">4</span>
                  Third-Party Services
                </h2>
                <p className="legal-text">
                  We use third-party services to enhance our platform functionality:
                </p>
                
                <div className="legal-services">
                  <div className="legal-service-card">
                    <h3 className="legal-service-title">4.1 Payment Processing</h3>
                    <p className="legal-text">
                      We use <strong>Razorpay</strong> for payment processing. Razorpay collects and processes your payment information according to their privacy policy. We do not store your complete payment details on our servers.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">4.2 Authentication</h3>
                    <p className="legal-text">
                      We use <strong>Clerk</strong> for user authentication and account management. Clerk handles user registration, login, and profile management according to their privacy policy.
                    </p>
                  </div>

                  <div className="legal-service-card">
                    <h3 className="legal-service-title">4.3 Media Storage</h3>
                    <p className="legal-text">
                      We use <strong>ImageKit</strong> for image storage and optimization. ImageKit processes and stores images uploaded to our platform according to their privacy policy.
                    </p>
                  </div>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">5</span>
                  Data Sharing and Disclosure
                </h2>
                <p className="legal-text">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                </p>
                <ul className="legal-list">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>To third-party service providers who assist us in operating our platform (subject to confidentiality agreements)</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">6</span>
                  Data Security
                </h2>
                <div className="legal-notice legal-notice-info">
                  <p>
                    We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">7</span>
                  Your Rights
                </h2>
                <p className="legal-text">You have the right to:</p>
                <div className="legal-grid">
                  <ul className="legal-list">
                    <li>Access and review your personal information</li>
                    <li>Update or correct your personal information</li>
                    <li>Request deletion of your personal information</li>
                  </ul>
                  <ul className="legal-list">
                    <li>Opt-out of marketing communications</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">8</span>
                  Cookies and Tracking
                </h2>
                <p className="legal-text">
                  We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and understand user behavior. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">9</span>
                  Children's Privacy
                </h2>
                <div className="legal-notice legal-notice-warning">
                  <p>
                    Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                  </p>
                </div>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">10</span>
                  Changes to This Privacy Policy
                </h2>
                <p className="legal-text">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of our service after any changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-number">11</span>
                  Contact Us
                </h2>
                <div className="legal-contact">
                  <p className="legal-text">
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
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