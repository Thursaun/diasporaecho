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
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center transition-opacity duration-300 z-50 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <form
          className={`space-y-4`}
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
          <button
            type="submit"
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isFormValid && !isLoading
                ? "bg-primary hover:bg-opacity-90"
                : "bg-gray-300 cursor-not-allowed"
            } transition-colors duration-200 mt-6`}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
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
