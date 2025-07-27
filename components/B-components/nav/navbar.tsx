'use client';

import { useState, useEffect, useRef } from 'react';
import { Home, User, Grid3X3, Menu, X, Bookmark, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { useUserCreation } from '@/lib/hooks/useUserCreation';
import './navbar.css';

// User creation component using the custom hook
const UserCreationHandler = () => {
  const { error, success } = useUserCreation();
  
  // Log status for debugging
  useEffect(() => {
    if (error) {
      console.error('User creation error:', error);
    }
    if (success) {
      // User creation successful
    }
  }, [error, success]);

  return null; // This component doesn't render anything
};

const NavbarClient = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const navbarRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted before rendering client-side state
  useEffect(() => {
    // Small delay to ensure smooth hydration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navItems = [
    { name: 'Home', icon: Home, href: '/', type: 'page' },
    { name: 'Category', icon: Grid3X3, href: '/category', type: 'page' },
    { name: 'Saved', icon: Bookmark, href: '/saved-tools', type: 'page', authRequired: true },
    { name: 'Pricing', icon: DollarSign, href: '/priceing', type: 'page' },
    { name: 'About', icon: User, href: '/about', type: 'page' },
  ];

  const handleNavClick = (item: { href: string; type: string }) => {
    // Close mobile menu immediately
    setIsOpen(false);
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      if (item.type === 'page') {
        // Navigate to page
        router.push(item.href);
      } else if (item.type === 'scroll') {
        // Scroll to section
        const element = document.querySelector(item.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  // Don't render mobile menu until component is mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <>
        {/* User Creation Handler */}
        <UserCreationHandler />

        {/* Desktop Navbar */}
        <div id="navparant">
          <div
            ref={navbarRef}
            className="navbar-main"
            style={{ opacity: 1 }}
          >
            <div className="navbar-desktop">
              {/* Logo */}
              <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                <div className="logo-circle">
                  <div className="logo-inner">
                    <div className="logo-dot"></div>
                  </div>
                </div>
                <span className="logo-text">AI Finder</span>
              </div>

              {/* Navigation Items */}
              <div ref={navItemsRef} className="nav-items">
                {navItems.map((item) => {
                  // Skip auth-required items for signed-out users
                  if (item.authRequired) {
                    return (
                      <SignedIn key={item.name}>
                        <button
                          onClick={() => handleNavClick(item)}
                          className="nav-btn"
                        >
                          <item.icon className="nav-icon" />
                          <span>{item.name}</span>
                        </button>
                      </SignedIn>
                    );
                  }
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      className="nav-btn"
                    >
                      <item.icon className="nav-icon" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
                {/* Clerk Buttons for Desktop */}
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="nav-btn">
                      <span>Sign In</span>
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="nav-btn">
                      <span>Sign Up</span>
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-8 h-8',
                        userButtonTrigger: 'nav-btn',
                      },
                    }}
                  />
                </SignedIn>
              </div>
            </div>

            {/* Mobile Navbar */}
            <div className="navbar-mobile">
              <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
                <div className="logo-circle">
                  <div className="logo-inner">
                    <div className="logo-dot"></div>
                  </div>
                </div>
                <span className="logo-text">AI Finder</span>
              </div>

              {/* Mobile Menu Button - Static for initial render */}
              <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={false}
                suppressHydrationWarning
              >
                <Menu className="mobile-menu-icon" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* User Creation Handler */}
      <UserCreationHandler />

      {/* Desktop Navbar */}
      <div id="navparant">
        <div
          ref={navbarRef}
          className={`navbar-main${scrolled ? ' scrolled' : ''}`}
          style={{ opacity: 1 }}
          data-testid="navbar"
        >
          <div className="navbar-desktop">
            {/* Logo */}
            <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <div className="logo-circle">
                <div className="logo-inner">
                  <div className="logo-dot"></div>
                </div>
              </div>
              <span className="logo-text">AI Finder</span>
            </div>

            {/* Navigation Items */}
            <div ref={navItemsRef} className="nav-items">
              {navItems.map((item) => {
                // Skip auth-required items for signed-out users
                if (item.authRequired) {
                  return (
                    <SignedIn key={item.name}>
                                        <button
                    onClick={() => handleNavClick(item)}
                    className="nav-btn"
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="nav-icon" />
                    <span>{item.name}</span>
                  </button>
                    </SignedIn>
                  );
                }
                
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavClick(item)}
                    className="nav-btn"
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="nav-icon" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
              {/* Clerk Buttons for Desktop */}
              <SignedOut>
                <SignInButton>
                  <button className="nav-btn" data-testid="sign-in-button">
                    <span>Sign In</span>
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="nav-btn" data-testid="sign-up-button">
                    <span>Sign Up</span>
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton
                  data-testid="user-button"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-8 h-8',
                      userButtonTrigger: 'nav-btn',
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Navbar */}
          <div className="navbar-mobile">
            <div className="logo-container" onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
              <div className="logo-circle">
                <div className="logo-inner">
                  <div className="logo-dot"></div>
                </div>
              </div>
              <span className="logo-text">AI Finder</span>
            </div>

            {/* Mobile Menu Button - Dynamic for mounted render */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={isOpen}
              suppressHydrationWarning
            >
              {isOpen ? <X className="mobile-menu-icon" /> : <Menu className="mobile-menu-icon" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="mobile-dropdown">
            {navItems.map((item, index) => {
              // Skip auth-required items for signed-out users
              if (item.authRequired) {
                return (
                  <SignedIn key={item.name}>
                    <button
                      onClick={() => handleNavClick(item)}
                      className="mobile-nav-btn"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <item.icon className="mobile-nav-icon" />
                      <span>{item.name}</span>
                    </button>
                  </SignedIn>
                );
              }
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item)}
                  className="mobile-nav-btn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <item.icon className="mobile-nav-icon" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {/* Clerk Buttons for Mobile */}
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="mobile-nav-btn"
                  style={{ animationDelay: `${navItems.length * 100}ms` }}
                >
                  <span>Sign In</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="mobile-nav-btn"
                  style={{ animationDelay: `${(navItems.length + 1) * 100}ms` }}
                >
                  <span>Sign Up</span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div
                className="mobile-nav-btn"
                style={{ animationDelay: `${navItems.length * 100}ms` }}
              >
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-6 h-6',
                      userButtonTrigger: 'flex items-center gap-3 text-white text-lg',
                    },
                  }}
                  afterSignOutUrl="/"
                />
                <span>Profile</span>
              </div>
            </SignedIn>
          </div>
        )}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

// Export the component directly since ClerkProvider is already in layout
export default NavbarClient;