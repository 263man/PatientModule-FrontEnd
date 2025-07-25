// telehealth-frontend/src/components/PatientDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Heart, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

function PatientDashboard() {
  const { token, logout } = useAuth();

  const [allPatientsData, setAllPatientsData] = useState([]); // Stores ALL unique fetched patients
  const [totalPatientsOverall, setTotalPatientsOverall] = useState(0); // Stores totalCount from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to calculate age from birthDate string
  const calculateAge = useCallback((birthDateString) => {
    if (!birthDateString) return null;
    try {
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      console.error("Error calculating age for birthDate:", birthDateString, e);
      return null;
    }
  }, []);

  // --- Data Processing for Charts ---
  const processPatientData = useCallback((patients) => {
    if (!Array.isArray(patients)) {
      console.error("processPatientData: Expected 'patients' to be an array, but received:", patients);
      return { processedGenderData: [], processedAgeData: [] };
    }

    // Gender distribution
    const genderCounts = patients.reduce((acc, patient) => {
      let gender = (patient && patient.gender && typeof patient.gender.value === 'string')
        ? patient.gender.value.toLowerCase()
        : 'unknown';
      
      const capitalizedGender = gender.charAt(0).toUpperCase() + gender.slice(1);
      acc[capitalizedGender] = (acc[capitalizedGender] || 0) + 1;
      return acc;
    }, {});
    const processedGenderData = Object.keys(genderCounts).map(key => ({
      name: key,
      value: genderCounts[key]
    }));

    // Age distribution into bins
    const ageBins = {
      '0-18': 0, '19-35': 0, '36-55': 0, '56+': 0
    };
    patients.forEach(patient => {
      const age = calculateAge(patient && patient.birthDate ? patient.birthDate.value : null);
      
      if (age !== null) {
        if (age <= 18) ageBins['0-18'] += 1;
        else if (age <= 35) ageBins['19-35'] += 1;
        else if (age <= 55) ageBins['36-55'] += 1;
        else ageBins['56+'] += 1;
      }
    });
    const processedAgeData = Object.keys(ageBins).map(key => ({
      ageRange: key,
      patients: ageBins[key]
    }));

    return { processedGenderData, processedAgeData };
  }, [calculateAge]);

  // --- Fetching ALL Patient Data using correct API pagination parameters ---
  useEffect(() => {
    const fetchAllPatientsForDashboard = async () => {
      setLoading(true);
      setError(null);
      let allFetchedPatientsRaw = []; // Temporarily stores all patients from all pages
      let currentPage = 1;
      let totalCountFromApi = 0;
      const patientsPerPage = 10; // Use the same page size as PatientsList.jsx

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        if (!apiBaseUrl) {
          throw new Error("VITE_API_BASE_URL is not defined in .env");
        }

        // --- Initial call to get totalCount and first page using _page and _pageSize ---
        console.log(`[Fetch Debug] Starting fetch for page ${currentPage} with _pageSize ${patientsPerPage}...`);
        let response = await fetch(`${apiBaseUrl}/api/patients?_page=${currentPage}&_pageSize=${patientsPerPage}`, { // CORRECTED PARAMETERS
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            logout();
            throw new Error("Unauthorized: Please log in again.");
          }
          let errorDetail = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorDetail = errorData.message || JSON.stringify(errorData);
          } catch (jsonError) {
            errorDetail = `${response.statusText || 'Unknown error'} (Status: ${response.status})`;
          }
          throw new Error(`Failed to fetch initial patients page: ${errorDetail}`);
        }

        let data = await response.json();
        console.log(`[Fetch Debug] Raw API data received (initial page ${currentPage}):`, data);
        console.log(`[Fetch Debug] Initial API totalCount: ${data.totalCount}`);

        if (data && Array.isArray(data.patients)) {
          allFetchedPatientsRaw = [...data.patients];
          totalCountFromApi = data.totalCount || data.patients.length;
          setTotalPatientsOverall(totalCountFromApi);
          console.log(`[Fetch Debug] Patients fetched on page ${currentPage}: ${data.patients.length}. Current allFetchedPatientsRaw.length: ${allFetchedPatientsRaw.length}`);

          // If totalCount is greater than the patients on the first page, fetch remaining pages
          if (totalCountFromApi > allFetchedPatientsRaw.length) {
            const numPages = Math.ceil(totalCountFromApi / patientsPerPage); // Use patientsPerPage here
            console.log(`[Fetch Debug] More pages to fetch. Total pages expected: ${numPages}`);
            for (currentPage = 2; currentPage <= numPages; currentPage++) {
              console.log(`[Fetch Debug] Fetching page ${currentPage}...`);
              response = await fetch(`${apiBaseUrl}/api/patients?_page=${currentPage}&_pageSize=${patientsPerPage}`, { // CORRECTED PARAMETERS
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });

              console.log(`[Fetch Debug] Response status for page ${currentPage}: ${response.status}`);
              if (!response.ok) {
                console.warn(`[Fetch Debug] Failed to fetch page ${currentPage}: ${response.statusText}. Continuing...`);
                continue; 
              }
              data = await response.json();
              console.log(`[Fetch Debug] Raw API data received for page ${currentPage}:`, data);

              if (data && Array.isArray(data.patients)) {
                allFetchedPatientsRaw = allFetchedPatientsRaw.concat(data.patients);
                console.log(`[Fetch Debug] Patients fetched on page ${currentPage}: ${data.patients.length}. Accumulated allFetchedPatientsRaw.length: ${allFetchedPatientsRaw.length}`);
              } else {
                console.warn(`[Fetch Debug] Page ${currentPage} response did not contain a valid 'patients' array. Data received:`, data);
              }
            }
          }

          // DEDUPLICATE PATIENTS HERE (still a good safeguard)
          const uniquePatientsMap = new Map();
          allFetchedPatientsRaw.forEach(patient => {
            if (patient.id && patient.id.value) {
              uniquePatientsMap.set(patient.id.value, patient);
            }
          });
          const uniquePatients = Array.from(uniquePatientsMap.values());
          
          setAllPatientsData(uniquePatients); // Set all ACCUMULATED AND DEDUPLICATED patients
          console.log("[Fetch Debug] Final unique patients fetched for dashboard (allPatientsData.length):", uniquePatients.length);

        } else {
          throw new Error("API response does not contain an array of patients at 'data.patients'.");
        }
      } catch (err) {
        console.error("[Fetch Debug] Error fetching all dashboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAllPatientsForDashboard();
    }
  }, [token, logout]);


  // --- Derived Data for rendering ---
  // These calculations now use the 'allPatientsData' which should contain all patients
  const { processedGenderData: genderChartData, processedAgeData: ageChartData } = processPatientData(allPatientsData);

  const displayedTotalPatients = totalPatientsOverall; 
  
  const activePatients = allPatientsData.length; 

  const ages = allPatientsData.map(patient => calculateAge(patient && patient.birthDate ? patient.birthDate.value : null)).filter(age => age !== null);
  const averageAge = ages.length > 0
    ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)
    : 'N/A';


  // Chart Colors (can be customized)
  const PIE_COLORS = ['#c694c8ff', '#878dcfff', '#ffc658', '#FF8042'];
  const BAR_COLOR = '#a9d0b1ff';

  if (loading) {
    return (
      <div className="bg-white shadow-2xl rounded-lg p-6 min-h-[60vh] flex items-center justify-center">
        <p className="text-xl font-semibold text-blue-600">Loading patient dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-2xl rounded-lg p-6 min-h-[60vh] flex flex-col items-center justify-center text-red-600">
        <p className="text-xl font-semibold mb-4">Error loading dashboard: {error}</p>
        <p className="text-gray-600">Please try again. If the problem persists, ensure your API is running and you are logged in.</p>
      </div>
    );
  }

  if (displayedTotalPatients === 0) {
    return (
      <div className="bg-white shadow-2xl rounded-lg p-6 min-h-[60vh] flex flex-col items-center justify-center text-gray-700">
        <p className="text-xl font-semibold mb-4">No patient data available to display on the dashboard.</p>
        <p>Please add some patients using the "Create New Patient" form.</p>
      </div>
    );
  }


  return (
    <div className="bg-white shadow-2xl rounded-lg p-6 min-h-[60vh]">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Patient Overview Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <Users className="text-blue-600" size={36} />
          <div>
            <div className="text-sm font-medium text-blue-700">Total Patients</div>
            <div className="text-3xl font-bold text-blue-800">{displayedTotalPatients}</div>
          </div>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <Heart className="text-green-600" size={36} />
          <div>
            <div className="text-sm font-medium text-green-700">Active Patients</div>
            <div className="text-3xl font-bold text-green-800">{activePatients}</div>
          </div>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow-md flex items-center space-x-4">
          <Calendar className="text-purple-600" size={36} />
          <div>
            <div className="text-sm font-medium text-purple-700">Average Age</div>
            <div className="text-3xl font-bold text-purple-800">{averageAge}</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gender Distribution Chart */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Gender Distribution</h3>
          {genderChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No gender data available for charting.</p>
          )}
        </div>

        {/* Age Distribution Chart */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Age Distribution</h3>
          {ageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ageChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageRange" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill={BAR_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No age data available for charting.</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-md text-gray-600">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Further Insights</h3>
        <p>This area will be expanded with more detailed reports, interactive maps, or specific patient journey visualizations as required.</p>
        
      </div>

    </div>
  );
}

export default PatientDashboard;