// telehealth-frontend/src/components/PatientsList.jsx

import React, { useState, useEffect, useCallback } from 'react';

function PatientsList({ refreshTrigger, onEditPatient, onDeletePatient, token }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false); // State for export loading
    
    // Moved searchTerm state and handler here
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [patientsPerPage] = useState(10); // Or make this configurable via props/UI
    const [totalPatients, setTotalPatients] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Function to fetch patients for the list (paginated)
    const fetchPatientsForList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (token === null || token.length === 0) {
                setError("Authentication token is missing. Please log in.");
                setLoading(false);
                return;
            }

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (apiBaseUrl === null || apiBaseUrl.length === 0) {
                throw new Error("VITE_API_BASE_URL is not defined in .env");
            }

            let url = `${apiBaseUrl}/api/patients?_page=${currentPage}&_pageSize=${patientsPerPage}`;

            // The searchTerm is now managed internally, so we apply it here
            if (searchTerm.length > 0) {
                url += `&name=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError("Session expired or unauthorized. Please log in again.");
                }
                const errorData = await response.json().catch(() => response.text());
                console.error("API Error Response:", errorData);
                throw new Error(errorData.message || errorData || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched Patient Data (Paginated):", data);

            if (data && Array.isArray(data.patients) && typeof data.totalCount === 'number') {
                setPatients(data.patients);
                setTotalPatients(data.totalCount);
                setTotalPages(Math.ceil(data.totalCount / patientsPerPage));
            } else {
                console.error("API did not return expected paginated patient data format:", data);
                setError("API did not return expected paginated patient data format.");
            }

        } catch (err) {
            console.error("Error fetching patients:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [refreshTrigger, searchTerm, token, currentPage, patientsPerPage]); // Dependencies for useCallback

    // Effect hook to call the fetch function when dependencies change
    useEffect(() => {
        fetchPatientsForList();
    }, [fetchPatientsForList]); // Dependency array for useEffect

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // New handler for internal search term change
    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    }, []);

    // Function to handle CSV export
    const handleExportCsv = async () => {
        setExporting(true);
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) {
                throw new Error("VITE_API_BASE_URL is not defined in .env");
            }

            // Fetch ALL patients for export, using a very large page size
            const exportPageSize = 10000; // Request a very large page size
            let exportUrl = `${apiBaseUrl}/api/patients?_page=1&_pageSize=${exportPageSize}`;
            
            // If a search term is active, apply it to the export URL too
            if (searchTerm.length > 0) {
                exportUrl += `&name=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(exportUrl, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => response.text());
                throw new Error(errorData.message || errorData || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.patients)) {
                throw new Error("API did not return expected patient data for export.");
            }

            // Define CSV headers
            const headers = [
                "FHIR ID",
                "First Name",
                "Last Name",
                "Email",
                "Phone",
                "Gender",
                "Birth Date"
            ];

            // Map patient data to CSV rows
            const csvRows = data.patients.map(patient => {
                const fhirId = patient.id?.value || '';
                const firstName = patient.name?.[0]?.given?.[0]?.value || '';
                const lastName = patient.name?.[0]?.family?.value || '';
                const email = patient.telecom?.find(t => t.system?.value === 'email')?.value?.value || '';
                const phone = patient.telecom?.find(t => t.system?.value === 'phone')?.value?.value || '';
                const gender = patient.gender?.value || '';
                const birthDate = patient.birthDate?.value || '';

                // Escape commas and wrap in quotes if necessary
                const escapeCsv = (value) => {
                    const stringValue = String(value);
                    return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                };

                return [
                    escapeCsv(fhirId),
                    escapeCsv(firstName),
                    escapeCsv(lastName),
                    escapeCsv(email),
                    escapeCsv(phone),
                    escapeCsv(gender),
                    escapeCsv(birthDate)
                ].join(',');
            });

            // Combine headers and rows
            const csvString = [
                headers.join(','),
                ...csvRows
            ].join('\n');

            // Create a Blob and download link
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) { // Feature detection for download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', 'patients_report.csv');
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url); // Clean up the object URL
            } else {
                // Fallback for browsers that don't support download attribute (e.g., older Safari)
                // This might open the CSV in a new tab instead of downloading
                window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvString));
            }

        } catch (err) {
            console.error("Error exporting patients to CSV:", err);
            setError(`Failed to export: ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <p className="text-center text-gray-600">Loading patients...</p>;
    }

    if (error) {
        return <p className="text-center text-red-600">Error: {error}</p>;
    }

    if (patients.length === 0 && totalPatients === 0 && !searchTerm) {
        return <p className="text-center text-gray-600">No patients found. Add new patients to get started.</p>;
    }

    // New condition for when search returns no results
    if (patients.length === 0 && totalPatients === 0 && searchTerm.length > 0) {
        return <p className="text-center text-gray-600">No patients found matching "{searchTerm}".</p>;
    }


    return (
        <div className="container mx-auto p-4">
            {/* Search Input */}
            <div className="mb-4"> {/* Adjusted margin-bottom for spacing */}
                <input
                    type="text"
                    placeholder="🔎Search by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Consolidated Header with "Patients List" title and Export Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Patients List</h2>
                <button
                    onClick={handleExportCsv}
                    disabled={exporting || totalPatients === 0}
                    // Minimal styling for the export button
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-1 px-3 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out text-sm"
                >
                    {exporting ? 'Exporting...' : 'Export to CSV'}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-left">FHIR ID</th>
                            <th className="py-3 px-6 text-left">First Name</th>
                            <th className="py-3 px-6 text-left">Last Name</th>
                            <th className="py-3 px-6 text-left">Email</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm font-light">
                        {patients.map((patient) => (
                            <tr key={patient.id?.value || (patient.identifier?.[0]?.value?.value) || Math.random()}>
                                <td className="py-3 px-6 text-left whitespace-nowrap">{patient.id?.value}</td>
                                <td className="py-3 px-6 text-left">
                                    {patient.name?.[0]?.given?.[0]?.value}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {patient.name?.[0]?.family?.value}
                                </td>
                                <td className="py-3 px-6 text-left">
                                    {patient.telecom?.find(t => t.system?.value === 'email')?.value?.value}
                                </td>
                                <td className="py-3 px-6 text-center space-x-2">
                                    {/* Edit button */}
                                    <button
                                        onClick={() => onEditPatient(patient.id?.value)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 rounded-md"
                                    >
                                        Edit
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        onClick={() => onDeletePatient(patient.id?.value, patient.name?.[0]?.given?.[0]?.value, patient.name?.[0]?.family?.value)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 rounded-md"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="text-gray-700">
                    Page {currentPage} of {totalPages} (Total Patients: {totalPatients})
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default PatientsList;
