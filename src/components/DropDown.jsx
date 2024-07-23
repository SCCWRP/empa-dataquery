import React, { useState, useRef, useEffect } from 'react';

const DropDownSelector = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSelectedValues, setLocalSelectedValues] = useState(selectedValues);
  const dropdownRef = useRef(null);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionChange = (option) => {
    const newSelectedValues = localSelectedValues.includes(option)
      ? localSelectedValues.filter((value) => value !== option)
      : [...localSelectedValues, option];
    setLocalSelectedValues(newSelectedValues);
  };

  const handleSelectAll = () => {
    setLocalSelectedValues(options);
  };

  const handleDeselectAll = () => {
    setLocalSelectedValues([]);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      alert('Please press Confirm when you are done');
    }
  };

  const handleClose = () => {
    if (localSelectedValues.length === 0) {
      alert('You need to choose at least one option');
    } else {
      onChange(localSelectedValues);
      setIsOpen(false);
      document.getElementById('root').classList.remove('blurred');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setLocalSelectedValues(selectedValues);
  }, [selectedValues]);

  return (
    <>
      {isOpen && <div className="custom-dropdown-overlay"></div>}
      <div className="custom-dropdown">
        <div
          className="custom-dropdown-toggle"
          onClick={handleToggleDropdown}
        >
          <div className="selected-values">
            {localSelectedValues.length > 0 ? (
              localSelectedValues.map((value) => (
                <span key={value} className="selected-value-bubble">
                  {value}
                </span>
              ))
            ) : (
              <span className="placeholder">{label}</span>
            )}
          </div>
        </div>
        {isOpen && (
          <div className="custom-dropdown-container" ref={dropdownRef}>
            <div className="custom-dropdown-menu">
              <div className="custom-dropdown-actions">
                <button
                  type="button"
                  className="custom-dropdown-close"
                  onClick={handleClose}
                >
                  Confirm
                </button>
                <button type="button" onClick={handleSelectAll}>Select All</button>
                <button type="button" onClick={handleDeselectAll}>Deselect All</button>
              </div>

              {options.map((option) => (
                <label key={option} className="custom-dropdown-option">
                  <input
                    type="checkbox"
                    checked={localSelectedValues.includes(option)}
                    onChange={() => handleOptionChange(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DropDownSelector;
