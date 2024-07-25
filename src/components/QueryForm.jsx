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
  const [affiliation, setAffiliation] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [affiliationError, setAffiliationError] = useState('');


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
  useEffect(() => {
    if (!name) {
      setNameError('Name is required');
    } else if (!/^[a-zA-Z_ ]+$/.test(name)) {
      setNameError('Invalid value. Only alphabetic characters, spaces, and underscores are allowed.');
    } else {
      setNameError('');
    }
  }, [name]);

  useEffect(() => {
    if (!affiliation) {
      setAffiliationError('Affiliation is required');
    } else if (!/^[a-zA-Z_ ]+$/.test(affiliation)) {
      setAffiliationError('Invalid value. Only alphabetic characters, spaces, and underscores are allowed.');
    } else {
      setAffiliationError('');
    }
  }, [affiliation]);

  useEffect(() => {
    if (!email) {
      setEmailError('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
    } else {
      setEmailError('');
    }
  }, [email]);

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
    setAffiliation('');

    fetchDropdownData(); // Re-fetch initial data
  };

  const [modalOpen, setModalOpen] = useState(false);

  const handleModalToggle = () => {
    setModalOpen(!modalOpen);
  };

  const handleSubmit = (e) => {
    console.log("submit clicked")

    e.preventDefault();

    if (!name) {
      window.alert('Name is required');
      return;
    }
    if (!affiliation) {
      window.alert('Affiliation is required');
      return;
    }

    const regex = /^[a-zA-Z_ ]+$/;
    if (!regex.test(name)) {
      window.alert('Invalid value. Only alphabetic characters, spaces, and underscores are allowed.');
      return;
    }

    if (!regex.test(affiliation)) {
      window.alert('Invalid value. Only alphabetic characters, spaces, and underscores are allowed.');
      return;
    }

    if (!email) {
      window.alert('Email is required');
      return;
    }

    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email matches the regex
    if (!emailRegex.test(email)) {
      window.alert('Invalid email format');
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
      user_email: email,
      user_affiliation: affiliation
    };
    console.log(selectedValues)
    
    setLoading(true);

    axios.post('/empadataquery/downloaddata', selectedValues)
    .then(response => {
      if (response.status === 200) {
        const { sql_queries, message, filename } = response.data;
        console.log(response.data)
        console.log("sql_queries")
        console.log(sql_queries)

        // Automatically trigger the file download
        const link = document.createElement('a');
        link.href = `/empadataquery/downloadfile/${filename}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

      } else {
        alert('Unexpected Error Occured. Please contact support.');
      }
    })
    .catch(error => {
      alert('Unexpected Error Occured. Please contact support.');
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
            {/* <img src='https://empachecker.sccwrp.org/empadataquery/assets/loader.gif' alt="Loading..." /> */}
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="p-4 bg-light shadow rounded">
        <h2 className="form-title">EMPA Advanced Query Tool</h2>

        <div className="form-button-container">
            <button type="button" className="btn btn-secondary" onClick={handleModalToggle}>
              Click to view the instruction
            </button>
        </div>
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Instructions</h3>
              <ul>
                <li>Filter your data using the dropdowns.</li>
                <li>Upon pressing the Download Data button, you will get data in .xlsx files and corresponding FGDC metadata in XML files.</li>
                <li>Contact Paul Smith pauls@sccwrp.org or Duy Nguyen duyn@sccwrp.org for assistance in case there is an error.</li>
              </ul>
              <button type="button" className="btn btn-primary" onClick={handleModalToggle}>
                Close
              </button>
            </div>
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="name" className="form-label">Enter Your Name <span style={{ color: 'red' }}>(required)</span>: </label>
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
          <label htmlFor="email" className="form-label">Enter Your Email <span style={{ color: 'red' }}>(required)</span>: </label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="affiliation" className="form-label">Enter Your Affiliation <span style={{ color: 'red' }}>(required)</span>: </label>
          <input
            type="affiliation"
            id="affiliation"
            className="form-control"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            required
          />
        </div>
        <label htmlFor="region" className="form-label">Select Region: </label>
        <DropDownSelector
          label="Select Region"
          options={regions}
          selectedValues={selectedRegions}
          onChange={(values) => handleDropdownChange(values, setSelectedRegions, 'region')}
        />
        <label htmlFor="estuaryclasses" className="form-label">Select Estuary Class:</label>
        <DropDownSelector
          label="Select Estuary Classes"
          options={estuaryClasses}
          selectedValues={selectedEstuaryClasses}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryClasses, 'estuary_class')}
        />
        <label htmlFor="mpastatus" className="form-label">Select MPA Status:</label>
        <DropDownSelector
          label="Select MPA Status"
          options={mpaStatuses}
          selectedValues={selectedMpaStatuses}
          onChange={(values) => handleDropdownChange(values, setSelectedMpaStatuses, 'mpa_status')}
        />
        <label htmlFor="estuarytypes" className="form-label">Select Estuary Type:</label>
        <DropDownSelector
          label="Select Estuary Types"
          options={estuaryTypes}
          selectedValues={selectedEstuaryTypes}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaryTypes, 'estuary_type')}
        />
        <label htmlFor="estuaries" className="form-label">Select Estuary:</label>
        <DropDownSelector
          label="Select Estuaries"
          options={estuaries}
          selectedValues={selectedEstuaries}
          onChange={(values) => handleDropdownChange(values, setSelectedEstuaries, 'estuary')}
        />
        <label htmlFor="projectids" className="form-label">Select ProjectID:</label>
        <DropDownSelector
          label="Select ProjectID"
          options={projectid}
          selectedValues={selectedProjectID}
          onChange={(values) => handleDropdownChange(values, setSelectedProjectID, 'projectid')}
        />
        <label htmlFor="years" className="form-label">Select Year:</label>
        <DropDownSelector
          label="Select Year"
          options={year}
          selectedValues={selectedYear}
          onChange={(values) => handleDropdownChange(values, setSelectedYear, 'year')}
        />
        <label htmlFor="sops" className="form-label">Select SOP:</label>
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
