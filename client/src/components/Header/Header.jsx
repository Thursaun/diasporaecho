import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.jpeg";

function Header({ loggedIn, onRegisterClick, onSignOut }) {
  return (
    <header className="bg-dark text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
            <h1 className="flex self-end text-3xl font-bold text-white leading-none my-4">Diaspora Echo</h1>
          </Link>
        </div>
        <nav>
          <ul className="flex space-x-6 items-center">
            <li>
              <NavLink to="/" className={({ isActive }) => 
                  isActive 
                    ? "text-secondary border-b-2 border-secondary pb-1" 
                    : "hover:text-secondary transition-colors duration-200"
                }>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/echoes" className={({ isActive }) => 
                  isActive 
                    ? "text-secondary border-b-2 border-secondary pb-1" 
                    : "hover:text-secondary transition-colors duration-200"
                }>
                Echoes
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => 
                  isActive 
                    ? "text-secondary border-b-2 border-secondary pb-1" 
                    : "hover:text-secondary transition-colors duration-200"
                }>
                About
              </NavLink>
            </li>
            {loggedIn ? (
              <>
                <li>
                  <NavLink to="/profile" className={({ isActive }) => 
                  isActive 
                    ? "text-secondary border-b-2 border-secondary pb-1" 
                    : "hover:text-secondary transition-colors duration-200"
                }>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <button className="bg-secondary text-dark px-4 py-2 rounded hover:bg-opacity-80 transition-colors duration-200" onClick={onSignOut}>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button className="bg-secondary text-dark px-4 py-2 rounded hover:bg-opacity-80 transition-colors duration-200" onClick={onRegisterClick}>
                  Sign up
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
