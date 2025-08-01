import Link from 'next/link'
import SocialCard from './social'

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
          <div className="footer-social">
            <SocialCard />
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #ffffff;
          padding: 3rem 0 1rem;
          margin-top: auto;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section {
          display: flex;
          flex-direction: column;
        }

        .footer-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #ffffff;
        }

        .footer-description {
          color: #cccccc;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links li {
          margin-bottom: 0.5rem;
        }

        .footer-link {
          color: #cccccc;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer-link:hover {
          color: #ffffff;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 1px solid #333333;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .footer-copyright {
          color: #999999;
          font-size: 0.9rem;
          margin: 0;
        }

        .footer-social {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .footer-bottom {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .footer-social {
            margin-top: 1rem;
          }
        }

        @media (max-width: 480px) {
          .footer {
            padding: 2rem 0 1rem;
          }

          .footer-container {
            padding: 0 0.5rem;
          }

          .footer-title {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </footer>
  )
} 