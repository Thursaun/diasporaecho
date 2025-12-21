import { Link, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../../assets/logo_small.jpg";

function Header({ loggedIn, onRegisterClick, onLoginClick, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // MODERN: Add scroll detection for navbar shrink effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // MODERN: Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigation items for cleaner code
  const navItems = [
    { to: "/", label: "Home", icon: "M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" },
    { to: "/echoes", label: "Echoes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { to: "/about", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];

  return (
    <>
      {/* MODERN: Sticky header with dynamic height based on scroll */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-dark/98 backdrop-blur-xl shadow-2xl py-2' 
            : 'bg-dark/95 backdrop-blur-md py-3 md:py-4'
        } border-b border-white/10`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* MODERN: Logo with enhanced hover effects */}
            <Link 
              to="/" 
              className="flex items-center gap-2 sm:gap-3 group" 
              onClick={closeMobileMenu}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/40 to-primary/40 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150"></div>
                <img
                  src={logo}
                  alt="Diaspora Echo"
                  className={`rounded-full object-cover ring-2 ring-secondary/50 group-hover:ring-secondary transition-all duration-300 relative z-10 group-hover:scale-110 ${
                    isScrolled ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12'
                  }`}
                />
              </div>
              <span className={`font-bold bg-gradient-to-r from-white via-white to-secondary bg-clip-text text-transparent group-hover:from-secondary group-hover:to-white transition-all duration-300 ${
                isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl md:text-3xl'
              }`}>
                Diaspora Echo
              </span>
            </Link>

            {/* MODERN: Desktop Navigation with pill-style active states */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative px-4 py-2 text-sm xl:text-base font-medium rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-secondary text-dark shadow-lg shadow-secondary/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              
              {/* Auth buttons */}
              {loggedIn ? (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `relative px-4 py-2 text-sm xl:text-base font-medium rounded-full transition-all duration-300 flex items-center gap-2 ${
                        isActive
                          ? "bg-secondary text-dark shadow-lg shadow-secondary/30"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                      }`
                    }
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </NavLink>
                  <button
                    onClick={onSignOut}
                    className="ml-2 px-5 py-2 text-sm xl:text-base font-semibold rounded-full bg-white/10 text-white border border-white/20 hover:bg-red-500/80 hover:border-red-400 hover:text-white transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={onLoginClick}
                    className="px-4 py-2 text-sm xl:text-base font-medium text-white/80 hover:text-white transition-colors duration-300"
                  >
                    Log In
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="px-5 py-2 text-sm xl:text-base font-semibold rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-dark hover:shadow-lg hover:shadow-secondary/40 hover:scale-105 transition-all duration-300"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </nav>

            {/* MODERN: Animated hamburger button */}
            <button
              className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all duration-300"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white rounded-full transform transition-all duration-300 origin-center ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}></span>
                <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                }`}></span>
                <span className={`w-full h-0.5 bg-white rounded-full transform transition-all duration-300 origin-center ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className={`transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16 md:h-20'}`}></div>

      {/* MODERN: Full-screen slide-in mobile menu */}
      <div 
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMobileMenuOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-dark/80 backdrop-blur-sm transition-opacity duration-500 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        ></div>

        {/* Slide-in panel */}
        <nav 
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-gradient-to-b from-dark via-dark to-dark/95 shadow-2xl transform transition-transform duration-500 ease-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile menu header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <span className="text-lg font-semibold text-white">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile nav items */}
          <div className="p-5 space-y-2">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-2xl font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-secondary text-dark shadow-lg"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                </div>
                <span className="text-lg">{item.label}</span>
              </NavLink>
            ))}

            {loggedIn && (
              <NavLink
                to="/profile"
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `flex items-center gap-4 p-4 rounded-2xl font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-secondary text-dark shadow-lg"
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-lg">Profile</span>
              </NavLink>
            )}
          </div>

          {/* Mobile auth buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 bg-dark/50 backdrop-blur-sm">
            {loggedIn ? (
              <button
                onClick={() => {
                  onSignOut();
                  closeMobileMenu();
                }}
                className="w-full py-4 rounded-2xl bg-white/10 text-white font-semibold hover:bg-red-500/80 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    onLoginClick();
                    closeMobileMenu();
                  }}
                  className="w-full py-4 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    onRegisterClick();
                    closeMobileMenu();
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 text-dark font-semibold hover:shadow-lg hover:shadow-secondary/40 transition-all duration-300"
                >
                  Sign Up Free
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

export default Header;