import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import logo from "../../assets/logo.jpeg";

function Header({ loggedIn, onRegisterClick, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-dark/95 backdrop-blur-md text-white shadow-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* MODERN: Enhanced Logo with glass morphism */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 md:gap-3 group" onClick={closeMobileMenu}>
              <div className="relative">
                {/* Animated glow effect on hover */}
                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={logo}
                  alt="Diaspora Echo Logo"
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-secondary/50 group-hover:ring-secondary transition-all duration-300 relative z-10 group-hover:scale-105"
                />
              </div>
              <h1 className="flex items-center text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight transition-all duration-300 group-hover:text-secondary">
                Diaspora Echo
              </h1>
            </Link>
          </div>

          {/* MODERN: Enhanced Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex space-x-4 xl:space-x-6 items-center">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-sm xl:text-base font-medium transition-all duration-300 px-3 py-2 rounded-lg relative ${isActive
                      ? "text-secondary"
                      : "text-white/90 hover:text-secondary hover:bg-white/5"}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      Home
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-secondary rounded-full"></span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/echoes"
                  className={({ isActive }) =>
                    `text-sm xl:text-base font-medium transition-all duration-300 px-3 py-2 rounded-lg relative ${isActive
                      ? "text-secondary"
                      : "text-white/90 hover:text-secondary hover:bg-white/5"}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      Echoes
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-secondary rounded-full"></span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `text-sm xl:text-base font-medium transition-all duration-300 px-3 py-2 rounded-lg relative ${isActive
                      ? "text-secondary"
                      : "text-white/90 hover:text-secondary hover:bg-white/5"}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      About
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-secondary rounded-full"></span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
              {loggedIn ? (
                <>
                  <li>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `text-sm xl:text-base font-medium transition-all duration-300 px-3 py-2 rounded-lg relative ${isActive
                          ? "text-secondary"
                          : "text-white/90 hover:text-secondary hover:bg-white/5"}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Profile
                          </span>
                          {isActive && (
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-secondary rounded-full"></span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                  <li>
                    <button
                      className="bg-secondary/90 backdrop-blur-sm text-dark px-4 py-2 text-sm xl:px-5 xl:py-2.5 xl:text-base rounded-lg hover:bg-secondary transition-all duration-300 font-semibold shadow-lg hover:shadow-secondary/50 hover:scale-105 border border-secondary"
                      onClick={onSignOut}
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    className="bg-secondary/90 backdrop-blur-sm text-dark px-4 py-2 text-sm xl:px-5 xl:py-2.5 xl:text-base rounded-lg hover:bg-secondary transition-all duration-300 font-semibold shadow-lg hover:shadow-secondary/50 hover:scale-105 border border-secondary"
                    onClick={onRegisterClick}
                  >
                    Sign up
                  </button>
                </li>
              )}
            </ul>
          </nav>

          {/* MODERN: Enhanced Mobile Hamburger Button */}
          <button
            className="lg:hidden p-2.5 rounded-lg bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all duration-300 border border-white/10 hover:border-secondary/30"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: isMobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* MODERN: Enhanced Mobile Navigation Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-96 opacity-100 mt-4'
              : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="border-t border-white/10 pt-4 bg-white/5 backdrop-blur-sm rounded-lg p-4">
            <ul className="flex flex-col space-y-2">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `block py-3 px-4 text-base transition-all duration-300 rounded-lg font-medium ${isActive
                      ? "text-secondary bg-white/10 border border-secondary/30 shadow-sm"
                      : "text-white/90 hover:text-secondary hover:bg-white/10 border border-transparent hover:border-white/10"}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    Home
                  </span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/echoes"
                  className={({ isActive }) =>
                    `block py-3 px-4 text-base transition-all duration-300 rounded-lg font-medium ${isActive
                      ? "text-secondary bg-white/10 border border-secondary/30 shadow-sm"
                      : "text-white/90 hover:text-secondary hover:bg-white/10 border border-transparent hover:border-white/10"}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Echoes
                  </span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    `block py-3 px-4 text-base transition-all duration-300 rounded-lg font-medium ${isActive
                      ? "text-secondary bg-white/10 border border-secondary/30 shadow-sm"
                      : "text-white/90 hover:text-secondary hover:bg-white/10 border border-transparent hover:border-white/10"}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    About
                  </span>
                </NavLink>
              </li>
              {loggedIn ? (
                <>
                  <li>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `block py-3 px-4 text-base transition-all duration-300 rounded-lg font-medium ${isActive
                          ? "text-secondary bg-white/10 border border-secondary/30 shadow-sm"
                          : "text-white/90 hover:text-secondary hover:bg-white/10 border border-transparent hover:border-white/10"}`
                      }
                      onClick={closeMobileMenu}
                    >
                      <span className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        Profile
                      </span>
                    </NavLink>
                  </li>
                  <li className="pt-3 mt-2 border-t border-white/10">
                    <button
                      className="w-full bg-secondary/90 backdrop-blur-sm text-dark px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-secondary/50 border border-secondary flex items-center justify-center gap-2"
                      onClick={() => {
                        onSignOut();
                        closeMobileMenu();
                      }}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li className="pt-3 mt-2 border-t border-white/10">
                  <button
                    className="w-full bg-secondary/90 backdrop-blur-sm text-dark px-4 py-3 rounded-lg hover:bg-secondary transition-all duration-300 font-semibold text-base shadow-lg hover:shadow-secondary/50 border border-secondary flex items-center justify-center gap-2"
                    onClick={() => {
                      onRegisterClick();
                      closeMobileMenu();
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                    Sign up
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;