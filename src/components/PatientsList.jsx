// telehealth-frontend/src/components/PatientsList.jsx

import React, { useState, useEffect, useCallback } from 'react';

function PatientsList({ refreshTrigger, onEditPatient, onDeletePatient, token }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exporting, setExporting] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const patientsPerPage = 10;
    const [totalPatients, setTotalPatients] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Fetch patients (paginated)
    const fetchPatientsForList = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (!token) {
                setError("Authentication token is missing. Please log in.");
                setLoading(false);
                return;
            }

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) {
                throw new Error("VITE_API_BASE_URL is not defined in .env");
            }

            // FIXED: Correct pagination params (page + pageSize)
            let url = `${apiBaseUrl}/api/patients?page=${currentPage}&pageSize=${patientsPerPage}`;

            if (searchTerm.length > 0) {
                url += `&name=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Session expired or unauthorized. Please log in again.");
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched Patient Data:", data);

            if (!data || !Array.isArray(data.patients)) {
                throw new Error("API did not return expected paginated format.");
            }

            setPatients(data.patients);
            setTotalPatients(data.totalCount);
            setTotalPages(Math.ceil(data.totalCount / patientsPerPage));

        } catch (err) {
            console.error("Error fetching patients:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, currentPage, searchTerm, refreshTrigger]);

    // Load patients when dependencies change
    useEffect(() => {
        fetchPatientsForList();
    }, [fetchPatientsForList]);

    // Pagination handler
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Search handler
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to page 1 after search
    };

    // CSV Export
    const handleExportCsv = async () => {
        setExporting(true);

        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) throw new Error("VITE_API_BASE_URL missing");

            // FIXED: Correct pagination params
            let exportUrl = `${apiBaseUrl}/api/patients?page=1&pageSize=10000`;

            if (searchTerm.length > 0) {
                exportUrl += `&name=${encodeURIComponent(searchTerm)}`;
            }

            const response = await fetch(exportUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || `Error ${response.status}`);
            }

            const data = await response.json();
            if (!Array.isArray(data.patients)) {
                throw new Error("Invalid export format");
            }

            const headers = [
                "FHIR ID",
                "First Name",
                "Last Name",
                "Email",
                "Phone",
                "Gender",
                "Birth Date"
            ];

            const csvRows = data.patients.map((p) => {
                const fhirId = p.id?.value || "";
                const firstName = p.name?.[0]?.given?.[0]?.value || "";
                const lastName = p.name?.[0]?.family?.value || "";
                const email = p.telecom?.find(t => t.system?.value === "email")?.value?.value || "";
                const phone = p.telecom?.find(t => t.system?.value === "phone")?.value?.value || "";
                const gender = p.gender?.value || "";
                const birthDate = p.birthDate?.value || "";

                const escape = (v) =>
                    ("" + v).includes(",") ? `"${("" + v).replace(/"/g, '""')}"` : v;

                return [
                    escape(fhirId),
                    escape(firstName),
                    escape(lastName),
                    escape(email),
                    escape(phone),
                    escape(gender),
                    escape(birthDate),
                ].join(",");
            });

            const csvString = [headers.join(","), ...csvRows].join("\n");

            const blob = new Blob([csvString], { type: "text/csv" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "patients_report.csv";
            link.click();

        } catch (err) {
            console.error("Export error:", err);
            setError(`Failed to export: ${err.message}`);
        } finally {
            setExporting(false);
        }
    };

    // UI States
    if (loading) return <p className="text-center text-gray-600">Loading patients...</p>;
    if (error) return <p className="text-center text-red-600">Error: {error}</p>;

    if (patients.length === 0 && !searchTerm) {
        return <p className="text-center text-gray-600">No patients found.</p>;
    }

    if (patients.length === 0 && searchTerm) {
        return <p className="text-center text-gray-600">No patients found for "{searchTerm}".</p>;
    }

    return (
        <div className="container mx-auto p-4">
            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="🔎 Search by name or email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 text-gray-800"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Header with CSV Export */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Patients List</h2>
                <button
                    onClick={handleExportCsv}
                    disabled={exporting || totalPatients === 0}
                    className="bg-white border border-gray-300 text-gray-700 py-1 px-3 rounded-md shadow-sm hover:bg-gray-100 disabled:opacity-50 text-sm"
                >
                    {exporting ? "Exporting..." : "Export CSV"}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-gray-200 text-gray-700 text-sm uppercase">
                        <tr>
                            <th className="py-3 px-6 text-left">FHIR ID</th>
                            <th className="py-3 px-6 text-left">First Name</th>
                            <th className="py-3 px-6 text-left">Last Name</th>
                            <th className="py-3 px-6 text-left">Email</th>
                            <th className="py-3 px-6 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                        {patients.map((patient) => (
                            <tr key={patient.id?.value}>
                                <td className="py-3 px-6">{patient.id?.value}</td>
                                <td className="py-3 px-6">{patient.name?.[0]?.given?.[0]?.value}</td>
                                <td className="py-3 px-6">{patient.name?.[0]?.family?.value}</td>
                                <td className="py-3 px-6">
                                    {patient.telecom?.find(t => t.system?.value === "email")?.value?.value}
                                </td>
                                <td className="py-3 px-6 text-center space-x-2">
                                    <button
                                        onClick={() => onEditPatient(patient.id?.value)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() =>
                                            onDeletePatient(
                                                patient.id?.value,
                                                patient.name?.[0]?.given?.[0]?.value,
                                                patient.name?.[0]?.family?.value
                                            )
                                        }
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                >
                    Previous
                </button>

                <span className="text-gray-700">
                    Page {currentPage} of {totalPages} — Total {totalPatients}
                </span>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default PatientsList;
