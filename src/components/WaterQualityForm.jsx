import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DropDownSelector from './DropDown';
import { TailSpin } from 'react-loader-spinner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const WaterQualityForm = ({ onBack }) => {
  const [regions, setRegions] = useState([]);
  const [sites, setSites] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [maxEndDate, setMaxEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial regions and parameters
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch sites when region changes
  useEffect(() => {
    if (selectedRegion) {
      fetchSites(selectedRegion);
    }
  }, [selectedRegion]);

  // Fetch parameters when region and site are selected
  useEffect(() => {
    if (selectedRegion && selectedSite) {
      fetchParameters(selectedRegion, selectedSite);
    }
  }, [selectedRegion, selectedSite]);

  const fetchRegions = () => {
    setLoading(true);
    axios.get('/empadataquery/wq/regions')
      .then(response => {
        setRegions(response.data.regions);
      })
      .catch(error => {
        console.error('Error fetching regions:', error);
        setErrorMessage('Error loading regions');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchSites = (region) => {
    setLoading(true);
    axios.get(`/empadataquery/wq/sites?region=${region}`)
      .then(response => {
        setSites(response.data.sites);
      })
      .catch(error => {
        console.error('Error fetching sites:', error);
        setErrorMessage('Error loading sites');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchParameters = (region, site) => {
    setLoading(true);
    axios.get(`/empadataquery/wq/parameters?region=${region}&siteid=${site}`)
      .then(response => {
        setParameters(response.data.parameters);
        setAvailableDates(response.data.available_dates || []);
        
        // Calculate min and max dates from available dates
        if (response.data.available_dates && response.data.available_dates.length > 0) {
          const dates = response.data.available_dates.map(d => 
            new Date(d.year, d.month - 1, 1)
          );
          const minD = new Date(Math.min(...dates));
          const maxD = new Date(Math.max(...dates));
          
          // Set to first day of min month and last day of max month
          setMinDate(new Date(minD.getFullYear(), minD.getMonth(), 1).toISOString().split('T')[0]);
          setMaxDate(new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0).toISOString().split('T')[0]);
        } else {
          setMinDate('');
          setMaxDate('');
        }
      })
      .catch(error => {
        console.error('Error fetching parameters:', error);
        setErrorMessage('Error loading parameters');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const validateDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // No date range limitation
    return true;
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date) {
      // Set max end date to the overall max date (no 6 month limitation)
      setMaxEndDate(maxDate);
    } else {
      setMaxEndDate('');
    }
  };

  const handleQueryData = () => {
    setErrorMessage('');
    
    // Validation
    if (!selectedRegion || !selectedSite || !startDate || !endDate || selectedParameters.length === 0) {
      setErrorMessage('Please fill in all fields');
      return;
    }



    const queryParams = {
      region: selectedRegion,
      siteid: selectedSite,
      startdate: startDate,
      enddate: endDate,
      parameters: selectedParameters
    };

    setLoading(true);
    axios.post('/empadataquery/wq/data', queryParams, {
      transformResponse: [(data) => {
        // Handle NaN values in the response by replacing with null
        if (typeof data === 'string') {
          const cleanedData = data.replace(/:\s*NaN/g, ': null');
          return JSON.parse(cleanedData);
        }
        return data;
      }]
    })
      .then(response => {
        console.log('Full response:', response);
        console.log('response.data:', response.data);
        
        let data = response.data.data;
        console.log('Data array length:', data ? data.length : 0);
        
        if (!Array.isArray(data)) {
          console.error('Data is not an array:', data);
          setErrorMessage('Invalid data format received from server');
          setChartData(null);
          return;
        }
        
        if (data && data.length > 0) {
          processChartData(data);
        } else {
          setErrorMessage('No data found for the selected criteria');
          setChartData(null);
        }
      })
      .catch(error => {
        console.error('Error fetching water quality data:', error);
        setErrorMessage('Error loading water quality data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const processChartData = (data) => {
    // Group data by parameter
    const parameterGroups = {};
    console.log('Processing chart data, total rows:', data.length);
    console.log('Selected parameters:', selectedParameters);
    console.log('First row columns:', data.length > 0 ? Object.keys(data[0]) : []);
    
    data.forEach(row => {
      selectedParameters.forEach(param => {
        const columnName = `raw_${param.toLowerCase()}`;
        if (row[columnName] !== null && row[columnName] !== undefined) {
          if (!parameterGroups[param]) {
            parameterGroups[param] = [];
          }
          parameterGroups[param].push({
            x: new Date(row.samplecollectiontimestamp),
            y: parseFloat(row[columnName])
          });
        }
      });
    });

    console.log('Parameter groups found:', Object.keys(parameterGroups));
    console.log('Data points per parameter:', Object.keys(parameterGroups).map(p => `${p}: ${parameterGroups[p].length}`));

    // Check if we have any data
    if (Object.keys(parameterGroups).length === 0) {
      setErrorMessage('No data found for the selected parameters and date range');
      setChartData(null);
      return;
    }

    // Create datasets for Chart.js
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)'
    ];

    const datasets = Object.keys(parameterGroups).map((param, index) => ({
      label: param.replace('_', ' ').toUpperCase(),
      data: parameterGroups[param],
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.5)'),
      tension: 0.1
    }));

    setChartData({
      datasets: datasets
    });
  };

  const handleReset = () => {
    setSelectedRegion('');
    setSelectedSite('');
    setStartDate('');
    setEndDate('');
    setSelectedParameters([]);
    setChartData(null);
    setErrorMessage('');
    setSites([]);
    setParameters([]);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Water Quality Data'
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            // Format date without time component
            const date = new Date(context[0].parsed.x);
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM d, yyyy'
          }
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  };

  return (
    <div className="form-container w-100">
      {loading && (
        <>
          <div className="loader-overlay"></div>
          <div className="loader-container">
            <TailSpin height="80" width="80" color="#3498db" ariaLabel="loading" />
          </div>
        </>
      )}
      
      {!chartData ? (
        <form className="p-4 bg-light shadow rounded">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="form-title">Water Quality Query Tool</h2>
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Back to Main Query
            </button>
          </div>

          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="region" className="form-label">Select Region <span style={{ color: 'red' }}>(required)</span>:</label>
            <select
              id="region"
              className="form-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              required
            >
              <option value="">-- Select Region --</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="site" className="form-label">Select Site <span style={{ color: 'red' }}>(required)</span>:</label>
            <select
              id="site"
              className="form-select"
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              required
              disabled={!selectedRegion}
            >
              <option value="">-- Select Site --</option>
              {sites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="startDate" className="form-label">
              Start Date <span style={{ color: 'red' }}>(required)</span>
              {minDate && maxDate && <span style={{ fontSize: '0.9em', color: '#666' }}> - Available: {minDate} to {maxDate}</span>}
            </label>
            <input
              type="date"
              id="startDate"
              className="form-control"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              min={minDate}
              max={maxDate}
              disabled={!minDate || !maxDate}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="endDate" className="form-label">End Date <span style={{ color: 'red' }}>(required)</span>:</label>
            <input
              type="date"
              id="endDate"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={maxEndDate}
              disabled={!startDate}
              required
            />
          </div>

          <label htmlFor="parameters" className="form-label">Select Parameters <span style={{ color: 'red' }}>(required)</span>:</label>
          <DropDownSelector
            label="Select Parameters"
            options={parameters}
            selectedValues={selectedParameters}
            onChange={setSelectedParameters}
          />

          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-primary" onClick={handleQueryData}>
              Query Data
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-light shadow rounded" style={{ height: '800px' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="form-title">Water Quality Data - {selectedSite}</h2>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary" onClick={() => setChartData(null)}>
                Back to Query
              </button>
              <button type="button" className="btn btn-secondary" onClick={onBack}>
                Back to Main Query
              </button>
            </div>
          </div>
          <div style={{ height: 'calc(100% - 60px)' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityForm;
