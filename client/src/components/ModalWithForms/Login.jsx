
import ModalWithForm from "./ModalWithForm";
import { useState } from "react";


function Login({ isOpen, onClose, onLogin, isLoading, onRegisterClick }) {
  const [error, setError] = useState("");

  const handleSubmit = (formValues) => {
    setError("");
    onLogin(formValues)
      .then(() => {
        onClose();
        setError("");
      })
      .catch(err => {
        setError(error.message);
        console.error("Login error:", err);
      }
    );
    onClose();
  };
  
  return (
    <ModalWithForm
      name="login"
      title="Sign In"
      isOpen={isOpen}
      onClose={onClose}
      buttonText="Sign In"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    >
      {({ formValues, formErrors, handleInputChange }) => (
        <>
        <div className="space-y-1 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formValues.email || ""}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            <span className="text-red-500 text-xs">{formErrors.email}</span>
          </label>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formValues.password || ""}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            <span className="text-red-500 text-xs">{formErrors.password}</span>
          </label>
          <p className="text-center text-sm text-gray-600 mt-4">
            Not a member yet?{" "}
            <button type="button" className="text-primary hover:text-primary-dark font-medium focus:outline-none" onClick={onRegisterClick}>
              Sign Up
            </button>
          </p>
        </>
      )}
    </ModalWithForm>
  );
}

export default Login;
