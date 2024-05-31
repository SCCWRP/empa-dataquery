import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dropdown from './Dropdown';

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
  const [loading, setLoading] = useState(false); // Define setLoading here
  
  
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
      })
      .catch(error => {
        console.error('Error fetching dropdown data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    // Fetch initial data for all dropdowns
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchDropdownData({ 
      region: selectedRegions.join(','), 
      estuary_class: selectedEstuaryClasses.join(','), 
      mpa_status: selectedMpaStatuses.join(','), 
      estuary_type: selectedEstuaryTypes.join(','), 
      estuary: selectedEstuaries.join(',')
    });
  }, [selectedRegions, selectedEstuaryClasses, selectedMpaStatuses, selectedEstuaryTypes, selectedEstuaries]);

  const handleRegionChange = (e) => {
    console.log("region change")
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedRegions(values);
  };

  const handleEstuaryClassChange = (e) => {
    console.log("handleEstuaryClassChange")
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedEstuaryClasses(values);
  };

  const handleMpaStatusChange = (e) => {
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedMpaStatuses(values);
  };

  const handleEstuaryTypeChange = (e) => {
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedEstuaryTypes(values);
  };

  const handleEstuaryChange = (e) => {
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedEstuaries(values);
  };
  
  const handleDtypeChange = (e) => {
    const options = e.target.options;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setSelectedDtypes(values);
  };
  

  const handleReset = () => {
    setSelectedRegions([]);
    setSelectedEstuaryClasses([]);
    setSelectedMpaStatuses([]);
    setSelectedEstuaryTypes([]);
    setSelectedEstuaries([]);
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
    axios.post('/empadataquery/downloaddata', selectedValues, { responseType: 'blob' })
    .then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data.zip'); // or set a different file name if desired
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => {
      console.error('Error submitting data:', error);
    });
  }



  return (
    <div className="form-container">
      <form>
        <Dropdown
          id="region-select"
          label="Select Region"
          options={regions}
          selectedValues={selectedRegions}
          onChange={handleRegionChange}
        />
        <Dropdown
          id="estuary-class-select"
          label="Select Estuary Classes"
          options={estuaryClasses}
          selectedValues={selectedEstuaryClasses}
          onChange={handleEstuaryClassChange}
        />
        <Dropdown
          id="mpa-status-select"
          label="Select MPA Status"
          options={mpaStatuses}
          selectedValues={selectedMpaStatuses}
          onChange={handleMpaStatusChange}
        />
        <Dropdown
          id="estuary-type-select"
          label="Select Estuary Types"
          options={estuaryTypes}
          selectedValues={selectedEstuaryTypes}
          onChange={handleEstuaryTypeChange}
        />
        <Dropdown
          id="estuary-select"
          label="Select Estuaries"
          options={estuaries}
          selectedValues={selectedEstuaries}
          onChange={handleEstuaryChange}
        />
        <Dropdown
          id="dtype-select"
          label="Select SOP to download data"
          options={dtypes}
          selectedValues={selectedDtypes}
          onChange={handleDtypeChange}
        />
        <div>
          <button type="button" onClick={handleReset}>Reset</button>
          <button type="submit" onClick={handleSubmit}>Download Data</button>
          <button type="button">Map - available soon</button>
          <button type="button">Analysis - available soon</button>
        </div>
      </form>
    </div>
  );
}

export default QueryForm;
