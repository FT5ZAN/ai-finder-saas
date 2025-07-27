import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <h3 className="footer-title">AI Finder</h3>
            <p className="footer-description">
              Discover and explore the best AI tools across all categories. Your ultimate directory for artificial intelligence applications and tools.
            </p>
            <div className="footer-contact">
              <a href="mailto:support@merlio.app" className="footer-link">
                support@merlio.app
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link href="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="footer-link">
                  About
                </Link>
              </li>
              <li>
                <Link href="/priceing" className="footer-link">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/saved-tools" className="footer-link">
                  Saved Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="footer-section">
            <h3 className="footer-title">Legal</h3>
            <ul className="footer-links">
              <li>
                <Link href="/legal/privacy-policy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund-policy" className="footer-link">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="footer-link">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} AI Finder. All rights reserved.
          </p>
          <div className="footer-info">
            <a href="https://merlio.app" className="footer-link">
              merlio.app
            </a>
            <span className="footer-separator">•</span>
            <a href="mailto:support@merlio.app" className="footer-link">
              support@merlio.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 