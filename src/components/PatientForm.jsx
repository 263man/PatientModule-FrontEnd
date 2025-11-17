// telehealth-frontend/src/components/PatientForm.jsx

import React, { useState, useEffect } from 'react';

// PatientForm now accepts patientData (for pre-filling), onPatientCreatedOrUpdated (callback for parent),
// isEditMode prop, onCloseForm prop for explicit form closing/resetting from parent, and the 'token' prop.
function PatientForm({ patientData, onPatientCreatedOrUpdated, isEditMode, onCloseForm, token }) { // Accept token prop
    // State to hold form input values
    const [fhirPatientId, setFhirPatientId] = useState(''); // State for FHIR ID in edit mode
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD format
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState(''); // 'male', 'female', 'other', 'unknown'

    // State for loading and error messages during form submission
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // useEffect to populate form fields when patientData prop changes (i.e., when editing a patient)
    useEffect(() => {
        if (patientData) {
            // When patientData is provided (in edit mode), pre-fill the form fields
            setFhirPatientId(patientData.fhirPatientId || '');
            setFirstName(patientData.firstName || '');
            setLastName(patientData.lastName || '');
            // Ensure birthDate is in YYYY-MM-DD format for input type="date"
            setBirthDate(patientData.birthDate ? patientData.birthDate.split('T')[0] : '');
            setEmail(patientData.email || '');
            setPhoneNumber(patientData.phoneNumber || '');
            setGender(patientData.gender || '');
            setError(null); // Clear any previous errors
            setSuccessMessage(null); // Clear any previous success messages
        } else {
            // When patientData is null (in create mode), clear the form fields
            setFhirPatientId('');
            setFirstName('');
            setLastName('');
            setBirthDate('');
            setEmail('');
            setPhoneNumber('');
            setGender('');
            setError(null);
            setSuccessMessage(null);
        }
    }, [patientData]); // Re-run this effect whenever patientData changes

    // useEffect to clear success message after a delay
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage(null);
            }, 3000); // Clear after 3 seconds
            return () => clearTimeout(timer); // Cleanup timer
        }
    }, [successMessage]);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        // Pre-flight check for token
        if (token === null || token.length === 0) {
            setError("Authentication token is missing. Please log in.");
            setLoading(false);
            return; // Exit early
        }

        // Construct the patient object based on your PatientModel in C#
        const patientToSubmit = {
            // Only include fhirPatientId if in edit mode
            ...(isEditMode && { fhirPatientId }),
            firstName,
            lastName,
            birthDate, // birthDate is already YYYY-MM-DD from type="date" input
            email,
            phoneNumber,
            gender: gender || null, // Send null if empty string
            // UserId is handled by the API/backend
        };

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        if (apiBaseUrl === null || apiBaseUrl.length === 0) {
            setError("VITE_API_BASE_URL is not defined in .env");
            setLoading(false);
            return; // Exit early
        }

        let url = `${apiBaseUrl}/api/patients`;
        let method = 'POST';

        if (isEditMode) {
            url = `${apiBaseUrl}/api/patients/${fhirPatientId}`; // Endpoint for update
            method = 'PUT'; // Use PUT for update
        }

        try {
            // MODIFIED: Add Authorization header
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // ADDED: Authorization header
                },
                body: JSON.stringify(patientToSubmit),
            });

            if (response.ok === false) {
                if (response.status === 401) {
                    setError("Session expired or unauthorized. Please log in again.");
                    // Optionally trigger a global logout here if you have a mechanism
                }
                const errorData = await response.json(); // Assuming API sends JSON errors
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const resultPatient = await response.json(); // Get the updated/created patient from the API response
            setSuccessMessage(`Patient '${resultPatient.firstName} ${resultPatient.lastName}' ${isEditMode ? 'updated' : 'created'} successfully!`);

            // Notify parent component (App.jsx) to refresh data and clear edit state
            // This will also cause the form to reset via the useEffect for patientData changing to null
            if (onPatientCreatedOrUpdated) {
                onPatientCreatedOrUpdated();
            }

        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} patient:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle Cancel Edit button click
    const handleCancelEdit = () => {
        if (onCloseForm) {
            onCloseForm(); // Call the parent's function to clear patientToEdit
        }
        setError(null); // Clear any errors
        setSuccessMessage(null); // Clear any success messages
    };


    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {isEditMode && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">FHIR ID</label>
                        <p className="mt-1 block w-full p-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-800">
                            {fhirPatientId}
                        </p>
                    </div>
                )}
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                        type="text"
                        id="firstName"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        type="text"
                        id="lastName"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Birth Date</label>
                    <input
                        type="date" // Use type="date" for native date picker
                        id="birthDate"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        id="email"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                        type="tel" // Use type="tel" for phone numbers
                        id="phoneNumber"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                        id="gender"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="unknown">Unknown</option>
                    </select>
                </div>

                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                {successMessage && <p className="text-green-600 text-sm mt-2">{successMessage}</p>}

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    disabled={loading}
                >
                    {loading ? (isEditMode ? 'Updating Patient...' : 'Creating Patient...') : (isEditMode ? 'Update Patient' : 'Create Patient')}
                </button>

                {isEditMode && (
                    <button
                        type="button" // Important: type="button" to prevent form submission
                        onClick={handleCancelEdit} // Call the new handler
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 mt-2"
                    >
                        Cancel Edit
                    </button>
                )}
            </form>
        </div>
    );
}

export default PatientForm;