// telehealth-frontend/src/App.jsx

import React, { useState, useCallback } from 'react';
import PatientsList from './components/PatientsList';
import PatientForm from './components/PatientForm';
import ConfirmationModal from './components/ConfirmationModal';
import LoginPage from './components/LoginPage';
import PatientDashboard from './components/PatientDashboard'; // Import the new dashboard component
import { useAuth } from './auth/AuthContext.jsx';

function App() {
    const { isLoggedIn, logout, token, isAuthChecking } = useAuth();

    const [refreshPatients, setRefreshPatients] = useState(0);
    const [patientToEdit, setPatientToEdit] = useState(null);
    const [loadingEditPatient, setLoadingEditPatient] = useState(false);
    const [editError, setEditError] = useState(null);

    const [showPatientForm, setShowPatientForm] = useState(false);
    // NEW STATE: To control which view is active (list or dashboard)
    const [currentView, setCurrentView] = useState('list'); // 'list' or 'dashboard'

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    const getAuthHeaders = useCallback(() => {
        if (token === null || token.length === 0) {
            console.warn("Attempted API call without a valid token. User might not be logged in.");
            return {};
        }
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    }, [token]);

    const handlePatientCreatedOrUpdated = useCallback(() => {
        setRefreshPatients(prev => prev + 1);
        setPatientToEdit(null);
        setShowPatientForm(false);
    }, []);

    const handleEditPatient = useCallback(async (fhirPatientId) => {
        setLoadingEditPatient(true);
        setEditError(null);
        setPatientToEdit(null);
        setShowPatientForm(true);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (apiBaseUrl === null || apiBaseUrl.length === 0) {
                throw new Error("VITE_API_BASE_URL is not defined in .env");
            }

            const response = await fetch(`${apiBaseUrl}/api/patients/${fhirPatientId}`, {
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized: Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const patientData = await response.json();
            console.log("Fetched patient for editing:", patientData);
            setPatientToEdit(patientData);

        } catch (err) {
            console.error("Error fetching patient for edit:", err);
            setEditError(err.message);
            if (err.message === "Unauthorized: Please log in again.") {
                logout();
            }
        } finally {
            setLoadingEditPatient(false);
        }
    }, [getAuthHeaders, logout]);

    const handleDeletePatient = useCallback((fhirPatientId, firstName, lastName) => {
        setPatientToDelete({ id: fhirPatientId, firstName, lastName });
        setShowDeleteConfirm(true);
        setDeleteError(null);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (patientToDelete === null) return;

        setDeleteLoading(true);
        setDeleteError(null);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (apiBaseUrl === null || apiBaseUrl.length === 0) {
                throw new Error("VITE_API_BASE_URL is not defined in .env");
            }

            const response = await fetch(`${apiBaseUrl}/api/patients/${patientToDelete.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Unauthorized: Please log in again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            setRefreshPatients(prev => prev + 1);
            setShowDeleteConfirm(false);
            setPatientToDelete(null);

        } catch (err) {
            console.error("Error deleting patient:", err);
            setDeleteError(err.message);
            if (err.message === "Unauthorized: Please log in again.") {
                logout();
            }
        } finally {
            setDeleteLoading(false);
        }
    }, [patientToDelete, setRefreshPatients, getAuthHeaders, logout]);

    const cancelDelete = useCallback(() => {
        setShowDeleteConfirm(false);
        setPatientToDelete(null);
        setDeleteError(null);
    }, []);

    const togglePatientForm = useCallback(() => {
        if (patientToEdit) {
            setPatientToEdit(null);
        }
        setShowPatientForm(prev => !prev);
    }, [patientToEdit]);

    if (isAuthChecking === true) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-xl font-semibold text-gray-700">Loading authentication...</p>
            </div>
        );
    }

    if (isLoggedIn === false) {
        return <LoginPage />;
    }

    const isFormVisible = showPatientForm || patientToEdit;

    return (
        // Changed bg-gray-100 to custom background image classes
        <div
            className="min-h-screen py-8 font-inter w-full px-4 sm:px-6"
            style={{
                backgroundImage: 'url("/download - Copy.jpg")', // Path to your image in the public folder
                backgroundSize: 'cover', // Ensures the image covers the entire background
                backgroundPosition: 'center', // Centers the image
                backgroundRepeat: 'no-repeat', // Prevents the image from repeating
            }}
        >
            <header className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4 sm:mb-0">Telehealth Patient Portal</h1>
                <div className="flex space-x-4"> {/* Container for navigation and logout buttons */}
                    <button
                        onClick={() => setCurrentView('list')}
                        className={`font-semibold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out ${
                            currentView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                        Patient List
                    </button>
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`font-semibold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out ${
                            currentView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={logout}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Conditional Rendering of Views */}
            {currentView === 'list' && (
                <>
                    <div className="mb-6 flex justify-start">
                        <button
                            onClick={togglePatientForm}
                            className={`font-semibold py-2 px-4 rounded-md shadow-sm transition duration-200 ease-in-out ${
                                isFormVisible ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        >
                            {isFormVisible ? (patientToEdit ? 'Cancel Edit & Hide Form' : 'Hide Form / Clear Patient') : 'Create New Patient'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {isFormVisible && (
                            <div className="md:col-span-1">
                                <div className="bg-white shadow-2xl rounded-lg p-6 h-full">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                        {patientToEdit ? 'Edit Patient' : 'Create New Patient'}
                                    </h2>
                                    {loadingEditPatient && <p className="text-blue-600 mb-4">Loading patient data...</p>}
                                    {editError && <p className="text-red-600 mb-4">Error: {editError}</p>}
                                    <PatientForm
                                        patientData={patientToEdit}
                                        onPatientCreatedOrUpdated={handlePatientCreatedOrUpdated}
                                        isEditMode={!!patientToEdit}
                                        onCloseForm={() => {
                                            setPatientToEdit(null);
                                            setShowPatientForm(false);
                                        }}
                                        token={token}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={`bg-white shadow-2xl rounded-lg p-6 h-full ${isFormVisible ? 'md:col-span-2' : 'md:col-span-3'}`}>
                            {/* PatientsList component now handles its own search bar */}
                            <PatientsList
                                refreshTrigger={refreshPatients}
                                onEditPatient={handleEditPatient}
                                onDeletePatient={handleDeletePatient}
                                token={token}
                            />
                        </div>
                    </div>
                </>
            )}

            {currentView === 'dashboard' && (
                <PatientDashboard />
            )}

            {showDeleteConfirm && patientToDelete && (
                <ConfirmationModal
                    message={`Are you sure you want to delete patient ${patientToDelete.firstName} ${patientToDelete.lastName} (ID: ${patientToDelete.id})? This action cannot be undone.`}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                    loading={deleteLoading}
                    error={deleteError}
                />
            )}
        </div>
    );
}

export default App;
