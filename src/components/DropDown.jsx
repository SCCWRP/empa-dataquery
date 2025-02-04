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

  // Common function to close the dropdown (like clicking outside or on the X button)
  const handleCloseDropdown = () => {
    if (localSelectedValues.length === 0) {
      alert('You need to choose at least one option');
    } else {
      onChange(localSelectedValues);
      setIsOpen(false);
      document.getElementById('root').classList.remove('blurred');
    }
  };

  // When clicking outside, auto-apply the selection (if at least one option is selected)
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      handleCloseDropdown();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [localSelectedValues]);

  // Update local state if the parent passes a new selection
  useEffect(() => {
    setLocalSelectedValues(selectedValues);
  }, [selectedValues]);

  return (
    <>
      {isOpen && <div className="custom-dropdown-overlay"></div>}
      <div className="custom-dropdown">
        <div className="custom-dropdown-toggle" onClick={handleToggleDropdown}>
          <div className="selected-values">
            {localSelectedValues.length > 0 ? (
              <>
                {localSelectedValues.slice(0, 5).map((value) => (
                  <span key={value} className="selected-value-bubble">
                    {value}
                  </span>
                ))}
                {localSelectedValues.length > 5 && (
                  <span className="more-values">
                    ... and {localSelectedValues.length - 5} more
                  </span>
                )}
              </>
            ) : (
              <span className="placeholder">{label}</span>
            )}
          </div>
        </div>
        {isOpen && (
          <div className="custom-dropdown-container" ref={dropdownRef}>
            {/* X icon as a small button on the top right with a light blue background and white icon */}
            <button
              type="button"
              className="close-icon"
              onClick={handleCloseDropdown}
              style={{
                cursor: 'pointer',
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '1px solid #ccc',
                backgroundColor: 'lightblue',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: '16px',
                padding: 0
              }}
            >
              ×
            </button>
            <div className="custom-dropdown-menu">
              <div className="custom-dropdown-actions">
                <button type="button" onClick={handleSelectAll}>
                  Select All
                </button>
                <button type="button" onClick={handleDeselectAll}>
                  Deselect All
                </button>
              </div>
              {/* Always render all options, regardless of selection */}
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
