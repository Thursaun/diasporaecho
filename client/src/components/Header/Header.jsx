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
    <header className="bg-dark text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 md:gap-3" onClick={closeMobileMenu}>
              <img src={logo} alt="Diaspora Echo Logo" className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover" />
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Diaspora Echo
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex space-x-4 xl:space-x-6 items-center">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `text-sm xl:text-base transition-colors duration-200 ${isActive 
                      ? "text-secondary border-b-2 border-secondary pb-1" 
                      : "hover:text-secondary"}`
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/echoes" 
                  className={({ isActive }) => 
                    `text-sm xl:text-base transition-colors duration-200 ${isActive 
                      ? "text-secondary border-b-2 border-secondary pb-1" 
                      : "hover:text-secondary"}`
                  }
                >
                  Echoes
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => 
                    `text-sm xl:text-base transition-colors duration-200 ${isActive 
                      ? "text-secondary border-b-2 border-secondary pb-1" 
                      : "hover:text-secondary"}`
                  }
                >
                  About
                </NavLink>
              </li>
              {loggedIn ? (
                <>
                  <li>
                    <NavLink 
                      to="/profile" 
                      className={({ isActive }) => 
                        `text-sm xl:text-base transition-colors duration-200 ${isActive 
                          ? "text-secondary border-b-2 border-secondary pb-1" 
                          : "hover:text-secondary"}`
                      }
                    >
                      Profile
                    </NavLink>
                  </li>
                  <li>
                    <button 
                      className="bg-secondary text-dark px-3 py-2 text-sm xl:px-4 xl:text-base rounded hover:bg-opacity-80 transition-colors duration-200 font-medium" 
                      onClick={onSignOut}
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <button 
                    className="bg-secondary text-dark px-3 py-2 text-sm xl:px-4 xl:text-base rounded hover:bg-opacity-80 transition-colors duration-200 font-medium" 
                    onClick={onRegisterClick}
                  >
                    Sign up
                  </button>
                </li>
              )}
            </ul>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            className="lg:hidden p-2 rounded-md text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white transition-colors duration-200"
            onClick={toggleMobileMenu}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen 
              ? 'max-h-96 opacity-100 mt-4' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="border-t border-gray-600 pt-4">
            <ul className="flex flex-col space-y-3">
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `block py-2 px-2 text-base transition-colors duration-200 rounded ${isActive 
                      ? "text-secondary bg-gray-700 font-medium" 
                      : "hover:text-secondary hover:bg-gray-700"}`
                  }
                  onClick={closeMobileMenu}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/echoes" 
                  className={({ isActive }) => 
                    `block py-2 px-2 text-base transition-colors duration-200 rounded ${isActive 
                      ? "text-secondary bg-gray-700 font-medium" 
                      : "hover:text-secondary hover:bg-gray-700"}`
                  }
                  onClick={closeMobileMenu}
                >
                  Echoes
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => 
                    `block py-2 px-2 text-base transition-colors duration-200 rounded ${isActive 
                      ? "text-secondary bg-gray-700 font-medium" 
                      : "hover:text-secondary hover:bg-gray-700"}`
                  }
                  onClick={closeMobileMenu}
                >
                  About
                </NavLink>
              </li>
              {loggedIn ? (
                <>
                  <li>
                    <NavLink 
                      to="/profile" 
                      className={({ isActive }) => 
                        `block py-2 px-2 text-base transition-colors duration-200 rounded ${isActive 
                          ? "text-secondary bg-gray-700 font-medium" 
                          : "hover:text-secondary hover:bg-gray-700"}`
                      }
                      onClick={closeMobileMenu}
                    >
                      Profile
                    </NavLink>
                  </li>
                  <li className="pt-2 border-t border-gray-600">
                    <button 
                      className="w-full text-left bg-secondary text-dark px-4 py-3 rounded hover:bg-opacity-80 transition-colors duration-200 font-medium text-base" 
                      onClick={() => {
                        onSignOut();
                        closeMobileMenu();
                      }}
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li className="pt-2 border-t border-gray-600">
                  <button 
                    className="w-full text-left bg-secondary text-dark px-4 py-3 rounded hover:bg-opacity-80 transition-colors duration-200 font-medium text-base" 
                    onClick={() => {
                      onRegisterClick();
                      closeMobileMenu();
                    }}
                  >
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