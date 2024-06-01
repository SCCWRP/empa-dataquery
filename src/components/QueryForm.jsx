import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomDropdown from './CustomDropdown';
import { TailSpin } from 'react-loader-spinner';

const QueryForm = () => {
  const [regions, setRegions] = useState([]);
  const [estuaryClasses, setEstuaryClasses] = useState([]);
  const [mpaStatuses, setMpaStatuses] = useState([]);
  const [estuaryTypes, setEstuaryTypes] = useState([]);
  const [estuaries, setEstuaries] = useState([]);
  const [dtypes, setDtypes] = useState([]);

  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedEstuaryClasses, setSelectedEstuaryClasses] = useState([]);
  const [selectedMpaStatuses, setSelectedMpaStatuses] = useState([]);
  const [selectedEstuaryTypes, setSelectedEstuaryTypes] = useState([]);
  const [selectedEstuaries, setSelectedEstuaries] = useState([]);
  const [selectedDtypes, setSelectedDtypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDropdownData = (params = {}) => {
    setLoading(true);
    const queryString = new URLSearchParams(params).toString();
    axios.get(`/empadataquery/populatedropdown?${queryString}`)
      .then(response => {
        const data = response.data;
        
        setRegions(data.regions);
        setEstuaryClasses(data.estuary_classes);
        setMpaStatuses(data.mpa_statuses);
        setEstuaryTypes(data.estuary_types);
        setEstuaries(data.estuaries);
        setDtypes(data.dtypes);

        setSelectedRegions(data.regions);
        setSelectedEstuaryClasses(data.estuary_classes);
        setSelectedMpaStatuses(data.mpa_statuses);
        setSelectedEstuaryTypes(data.estuary_types);
        setSelectedEstuaries(data.estuaries);

        // Automatically select all options for initial load
        if (Object.keys(params).length === 0) {
          setSelectedDtypes(data.dtypes.length > 0 ? [data.dtypes[0]] : []);
        }
      })
      .catch(error => {
        console.error('Error fetching dropdown data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const handleDropdownChange = (selectedValues, dropdownSetter, type) => {
    dropdownSetter(selectedValues);

    // Create params based on the selected values
    const params = {
      region: selectedRegions.join(','),
      estuary_class: selectedEstuaryClasses.join(','),
      mpa_status: selectedMpaStatuses.join(','),
      estuary_type: selectedEstuaryTypes.join(','),
      estuary: selectedEstuaries.join(',')
    };

    // Add the new selection to the params
    params[type] = selectedValues.join(',');

    // Fetch the new data based on the updated params
    fetchDropdownData(params);
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setSelectedEstuaryClasses([]);
    setSelectedMpaStatuses([]);
    setSelectedEstuaryTypes([]);
    setSelectedEstuaries([]);
    setSelectedDtypes([]);
    fetchDropdownData(); // Re-fetch initial data
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedValues = {
      region: selectedRegions,
      estuaryclass: selectedEstuaryClasses,
      mpastatus: selectedMpaStatuses,
      estuarytype: selectedEstuaryTypes,
      estuaryname: selectedEstuaries,
      dtype: selectedDtypes,
    };
    console.log(selectedValues)
    setLoading(true);
    axios.post('/empadataquery/downloaddata', selectedValues, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'data.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(error => {
        console.error('Error submitting data:', error);
      }).finally(() => {
        setLoading(false); // Stop loading
      });
  };

  return (
    <div className="form-container">
      {loading && (
        <>
          <div className="loader-overlay"></div>
          <div className="loader-container">
            <TailSpin height="80" width="80" color="#3498db" ariaLabel="loading" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <CustomDropdown
          label="Select Region"
          options={regions}
          selectedValues={selectedRegions}
          onChange={(values) => handleDropdownChange(values, setSelectedRegions, 'region')}
        />
        <CustomDropdown
          label="Select Estuary Classes"
          options={estuaryClasses}
          selectedValues={selectedEstuaryClasses}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryClasses, 'estuary_class')}
        />
        <CustomDropdown
          label="Select MPA Status"
          options={mpaStatuses}
          selectedValues={selectedMpaStatuses}
          onChange={(values) => handleDropdownChange(values, setSelectedMpaStatuses, 'mpa_status')}
        />
        <CustomDropdown
          label="Select Estuary Types"
          options={estuaryTypes}
          selectedValues={selectedEstuaryTypes}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryTypes, 'estuary_type')}
        />
        <CustomDropdown
          label="Select Estuaries"
          options={estuaries}
          selectedValues={selectedEstuaries}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaries, 'estuary')}
        />
        <CustomDropdown
          label="Select SOP to download data"
          options={dtypes}
          selectedValues={selectedDtypes}
          onChange={(values) => handleDropdownChange(values, setSelectedDtypes, 'dtype')}
        />
        <div>
          <button type="button" onClick={handleReset}>Reset</button>
          <button type="submit">Download Data</button>
          <button type="button">Map - available soon</button>
          <button type="button">Analysis - available soon</button>
        </div>
      </form>
    </div>
  );
}

export default QueryForm;
