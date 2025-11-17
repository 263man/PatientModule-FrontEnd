// telehealth-frontend/src/components/PatientForm.jsx

import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function PatientForm({ patientData, onPatientCreatedOrUpdated, isEditMode, onCloseForm, token }) {

    const [fhirPatientId, setFhirPatientId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState(''); // stored as YYYY-MM-DD
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (patientData) {
            setFhirPatientId(patientData.fhirPatientId || '');
            setFirstName(patientData.firstName || '');
            setLastName(patientData.lastName || '');
            setBirthDate(
                patientData.birthDate
                    ? patientData.birthDate.split("T")[0]
                    : ''
            );
            setEmail(patientData.email || '');
            setPhoneNumber(patientData.phoneNumber || '');
            setGender(patientData.gender || '');
            setError(null);
            setSuccessMessage(null);
        } else {
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
    }, [patientData]);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (!token) {
            setError("Authentication token is missing. Please log in.");
            setLoading(false);
            return;
        }

        const patientToSubmit = {
            ...(isEditMode && { fhirPatientId }),
            firstName,
            lastName,
            birthDate,
            email,
            phoneNumber,
            gender: gender || null,
        };

        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        if (!apiBaseUrl) {
            setError("VITE_API_BASE_URL is not defined in .env");
            setLoading(false);
            return;
        }

        let url = `${apiBaseUrl}/api/patients`;
        let method = 'POST';

        if (isEditMode) {
            url = `${apiBaseUrl}/api/patients/${fhirPatientId}`;
            method = 'PUT';
        }

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(patientToSubmit),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError("Session expired or unauthorized. Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error: ${response.status}`);
            }

            const result = await response.json();
            setSuccessMessage(`Patient '${result.firstName} ${result.lastName}' ${isEditMode ? 'updated' : 'created'} successfully!`);

            if (onPatientCreatedOrUpdated) {
                onPatientCreatedOrUpdated();
            }

        } catch (err) {
            console.error("Error submitting patient:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (onCloseForm) onCloseForm();
        setError(null);
        setSuccessMessage(null);
    };

    // Helper: convert YYYY-MM-DD to Date object (for react-datepicker)
    const birthDateAsDate = birthDate ? new Date(birthDate) : null;

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

                {/* --- UPDATED DOB FIELD --- */}
                <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Birth Date</label>

                    <DatePicker
                        selected={birthDateAsDate}
                        onChange={(date) => {
                            if (date) {
                                const formatted = date.toISOString().split("T")[0];
                                setBirthDate(formatted);
                            } else {
                                setBirthDate("");
                            }
                        }}

                        dateFormat="yyyy-MM-dd"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={120}
                        maxDate={new Date()}
                        placeholderText="Select date of birth"

                        openToDate={
                            birthDateAsDate
                                ? birthDateAsDate
                                : new Date("1980-01-01")
                        }

                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-800"
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
                        type="tel"
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
                    {loading ? (isEditMode ? 'Updating Patient...' : 'Creating Patient...') :
                        (isEditMode ? 'Update Patient' : 'Create Patient')}
                </button>

                {isEditMode && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
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
