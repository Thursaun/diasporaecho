import { useState, useEffect } from "react";

function ModalWithForm({
  title,
  name,
  isOpen,
  onClose,
  buttonText,
  onSubmit,
  isLoading = false,
  children,
}) {
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormValues({});
      setFormErrors({});
      setIsFormValid(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const closeByEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", closeByEsc);
      return () => {
        document.removeEventListener("keydown", closeByEsc);
      };
    }
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, validationMessage, validity } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });

    setFormErrors({
      ...formErrors,
      [name]: validity.valid ? "" : validationMessage,
    });

    const form = e.target.closest("form");
    setIsFormValid(form.checkValidity());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      onSubmit(formValues);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center transition-opacity duration-300 z-50 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      {/* MODERN: Enhanced modal container with glass morphism */}
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 relative transform transition-all duration-300 ${
        isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
      }`}>
        {/* MODERN: Close button with hover effect */}
        <button
          type="button"
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/50"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* MODERN: Title with decorative line */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <div className="h-1 w-16 bg-gradient-to-r from-secondary to-secondary/50 rounded-full"></div>
        </div>

        <form
          className="space-y-4"
          name={name}
          onSubmit={handleSubmit}
          noValidate
        >
          {children ? (
            children({
              formValues,
              formErrors,
              handleInputChange,
              isFormValid,
            })
          ) : (
            <>
              <div className="space-y-1">
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
              </div>
              <div className="space-y-1">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formValues.password || ""}
                  minLength="8"
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                <span className="text-red-500 text-xs">{formErrors.password}</span>
              </div>
              {name === "register" && (
                <div className="space-y-1">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formValues.username || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <span className="text-red-500 text-xs">{formErrors.username}</span>
                </div>
              )}
            </>
          )}

          {/* MODERN: Submit button with gradient and animations */}
          <button
            type="submit"
            className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white transition-all duration-300 mt-6 ${
              isFormValid && !isLoading
                ? "bg-secondary hover:bg-secondary/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gray-300 cursor-not-allowed opacity-60"
            }`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              buttonText
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ModalWithForm;
