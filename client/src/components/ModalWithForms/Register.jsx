
import ModalWithForm from "./ModalWithForm";


function Register({ isOpen, onClose, onRegister, isLoading, onLoginClick }) {
    
    const handleSubmit = (formValues) => {
        onRegister(formValues)
        onClose();
    };

    return (
        <ModalWithForm
            name="register"
            title="Register"
            isOpen={isOpen}
            onClose={onClose}
            buttonText="Sign Up"
            onSubmit={handleSubmit}
            isLoading={isLoading}
        >

        {({ formValues, formErrors, handleInputChange }) => (
            <>
                <div className="space-y-1 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                        <input
                            type="text"
                            name="name"
                            value={formValues.name || ""}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                        <span className="text-red-500 text-xs">{formErrors.name}</span>
                    </label>
                </div>
                <div className="space-y-1 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                        <input
                            type="email"
                            name="email"
                            value={formValues.email || ""}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                        <span className="text-red-500 text-xs">{formErrors.email}</span>
                    </label>
                </div>
                <div className="space-y-1 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                        <input
                            type="password"
                            name="password"
                            value={formValues.password || ""}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                        <span className="text-red-500 text-xs">{formErrors.password}</span>
                    </label>
                </div>
                <p className="text-center text-sm text-gray-600 mt-4">
                    Already a member?{" "}
                    <button type="button" className="text-primary hover:text-primary-dark font-medium focus:outline-none" onClick={onLoginClick}>
                        Sign In
                    </button>
                </p>
            </>
        )}
        </ModalWithForm>
    );
};


export default Register;