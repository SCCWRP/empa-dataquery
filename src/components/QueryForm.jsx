import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DropDownSelector from './DropDown';
import { TailSpin } from 'react-loader-spinner';
import 'bootstrap/dist/css/bootstrap.min.css';

const QueryForm = () => {
  const [regions, setRegions] = useState([]);
  const [estuaryClasses, setEstuaryClasses] = useState([]);
  const [mpaStatuses, setMpaStatuses] = useState([]);
  const [estuaryTypes, setEstuaryTypes] = useState([]);
  const [estuaries, setEstuaries] = useState([]);
  const [dtypes, setDtypes] = useState([]);
  const [projectid, setProjectID] = useState([]);
  const [year, setYear] = useState([]);

  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedEstuaryClasses, setSelectedEstuaryClasses] = useState([]);
  const [selectedMpaStatuses, setSelectedMpaStatuses] = useState([]);
  const [selectedEstuaryTypes, setSelectedEstuaryTypes] = useState([]);
  const [selectedEstuaries, setSelectedEstuaries] = useState([]);
  const [selectedDtypes, setSelectedDtypes] = useState([]);
  const [selectedProjectID, setSelectedProjectID] = useState([]);
  const [selectedYear, setSelectedYear] = useState([]);
  const [loading, setLoading] = useState(false);


  const [name, setName] = useState('');
  const [email, setEmail] = useState('');


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
        setProjectID(data.projectids);
        setYear(data.years);

        setSelectedRegions(data.regions);
        setSelectedEstuaryClasses(data.estuary_classes);
        setSelectedMpaStatuses(data.mpa_statuses);
        setSelectedEstuaryTypes(data.estuary_types);
        setSelectedEstuaries(data.estuaries);
        setSelectedProjectID(data.projectids);
        setSelectedYear(data.years);

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
      estuary: selectedEstuaries.join(','),
      projectid: selectedProjectID.join(','),
      year: selectedYear.join(',')
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
    setSelectedProjectID([]);
    setSelectedYear([]);
    setName('');
    setEmail('');

    fetchDropdownData(); // Re-fetch initial data
  };

  // const validateForm = () => {
  //   const newErrors = {};
  //   if (!name) newErrors.name = 'Name is required';
  //   if (!email) newErrors.email = 'Email is required';
  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmit = (e) => {
    console.log("submit clicked")

    e.preventDefault();

    if (!name) {
      window.alert('Name is required');
      return;
    }

    if (!email) {
      window.alert('Email is required');
      return;
    }

    const selectedValues = {
      region: selectedRegions,
      estuaryclass: selectedEstuaryClasses,
      mpastatus: selectedMpaStatuses,
      estuarytype: selectedEstuaryTypes,
      estuaryname: selectedEstuaries,
      dtype: selectedDtypes,
      projectid: selectedProjectID,
      year: selectedYear,
      user_name: name,
      user_email: email
    };
    console.log(selectedValues)
    
    setLoading(true);

    axios.post('/empadataquery/downloaddata', selectedValues, { responseType: 'blob' })
    .then(response => {
      console.log(response.status)
      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'data.zip');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert('Unexpected Error Occured. Please contact Duy Nguyen duyn@sccwrp.org for assistance');
      }
    })
    .catch(error => {
      alert('Unexpected Error Occured. Please contact Duy Nguyen duyn@sccwrp.org for assistance');
      console.error('Error submitting data:', error);
    })
    .finally(() => {
      setLoading(false); // Stop loading
    });
  

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
      <form onSubmit={handleSubmit} className="p-4 bg-light shadow rounded">
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            id="name"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <DropDownSelector
          label="Select Region"
          options={regions}
          selectedValues={selectedRegions}
          onChange={(values) => handleDropdownChange(values, setSelectedRegions, 'region')}
        />
        <DropDownSelector
          label="Select Estuary Classes"
          options={estuaryClasses}
          selectedValues={selectedEstuaryClasses}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryClasses, 'estuary_class')}
        />
        <DropDownSelector
          label="Select MPA Status"
          options={mpaStatuses}
          selectedValues={selectedMpaStatuses}
          onChange={(values) => handleDropdownChange(values, setSelectedMpaStatuses, 'mpa_status')}
        />
        <DropDownSelector
          label="Select Estuary Types"
          options={estuaryTypes}
          selectedValues={selectedEstuaryTypes}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryTypes, 'estuary_type')}
        />
        <DropDownSelector
          label="Select Estuaries"
          options={estuaries}
          selectedValues={selectedEstuaries}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaries, 'estuary')}
        />
        <DropDownSelector
          label="Select ProjectID"
          options={projectid}
          selectedValues={selectedProjectID}
          onChange={(values) => handleDropdownChange(values, setSelectedProjectID, 'projectid')}
        />
        <DropDownSelector
          label="Select Year"
          options={year}
          selectedValues={selectedYear}
          onChange={(values) => handleDropdownChange(values, setSelectedYear, 'year')}
        />
        <DropDownSelector
          label="Select SOP to download data"
          options={dtypes}
          selectedValues={selectedDtypes}
          onChange={(values) => handleDropdownChange(values, setSelectedDtypes, 'dtype')}
        />
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Download Data</button>
          <br></br>
          <button type="button" className="btn btn-primary" onClick={handleReset}>Reset</button>
          {/* <button type="button" className="btn btn-secondary">Map - available soon</button>
          <button type="button" className="btn btn-secondary">Analysis - available soon</button> */}
        </div>
      </form>
    </div>
  );
}

export default QueryForm;
