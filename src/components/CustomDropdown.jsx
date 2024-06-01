import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ label, options, selectedValues, onChange }) => {
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
      setIsOpen(false);
      document.body.classList.remove('blurred');
    }
  };

  const handleClose = () => {
    onChange(localSelectedValues);
    setIsOpen(false);
    document.body.classList.remove('blurred');
  };

  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.classList.add('blurred');
  //   } else {
  //     document.body.classList.remove('blurred');
  //   }
  // }, [isOpen]);

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
        <button
          type="button"
          className="custom-dropdown-toggle"
          onClick={handleToggleDropdown}
        >
          {label}
        </button>
        <div className="selected-values">
          {selectedValues.join(', ') || 'None'}
        </div>
        {isOpen && (
          <div className="custom-dropdown-container" ref={dropdownRef}>
            <div className="custom-dropdown-menu">
              <div className="custom-dropdown-actions">
                <button type="button" onClick={handleSelectAll}>Select All</button>
                <button type="button" onClick={handleDeselectAll}>Deselect All</button>
                <button
                  type="button"
                  className="custom-dropdown-close"
                  onClick={handleClose}
                >
                  Confirm
                </button>
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

export default CustomDropdown;
