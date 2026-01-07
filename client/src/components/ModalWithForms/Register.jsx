import ModalWithForm from "./ModalWithForm";
import { useState } from "react";

function Register({ isOpen, onClose, onRegister, isLoading, onLoginClick }) {
  const [error, setError] = useState("");

  const handleSubmit = (formValues) => {
    setError("");
    onRegister(formValues).catch((err) => {
      const errorMessage = err.message || "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("Registration error:", err);
    });
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  return (
    <ModalWithForm
      name="register"
      title="Create Account"
      isOpen={isOpen}
      onClose={handleClose}
      buttonText="Sign Up"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      {({ formValues, formErrors, handleInputChange }) => (
        <>
          {/* MODERN: Error Alert Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-shake">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* MODERN: Username Input */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="name"
                placeholder="Choose a username"
                value={formValues.name || ""}
                onChange={handleInputChange}
                required
                minLength="2"
                maxLength="30"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              />
            </div>
            {formErrors.name && (
              <p className="text-red-600 text-xs font-medium flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {formErrors.name}
              </p>
            )}
          </div>

          {/* MODERN: Email Input */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formValues.email || ""}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              />
            </div>
            {formErrors.email && (
              <p className="text-red-600 text-xs font-medium flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {formErrors.email}
              </p>
            )}
          </div>

          {/* MODERN: Password Input */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formValues.password || ""}
                onChange={handleInputChange}
                required
                minLength="8"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-all duration-200 bg-white/50 backdrop-blur-sm hover:bg-white"
              />
            </div>
            {formErrors.password && (
              <p className="text-red-600 text-xs font-medium flex items-center gap-1 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {formErrors.password}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Must be at least 8 characters long
            </p>
          </div>

          {/* MODERN: Sign In Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already a member?{" "}
              <button
                type="button"
                className="text-secondary hover:text-secondary/80 font-semibold focus:outline-none focus:underline transition-colors duration-200"
                onClick={onLoginClick}
              >
                Sign In
              </button>
            </p>
          </div>
        </>
      )}
    </ModalWithForm>
  );
}

export default Register;
