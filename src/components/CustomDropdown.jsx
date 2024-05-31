import React, { useState, useRef, useEffect } from 'react';

const CustomDropdown = ({ label, options, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionChange = (e, option) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];
    onChange(newSelectedValues);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <button className="custom-dropdown-toggle" onClick={handleToggleDropdown}>
        {label}
      </button>
      {isOpen && (
        <div className="custom-dropdown-menu">
          <button className="custom-dropdown-close" onClick={handleToggleDropdown}>
            Close
          </button>
          {options.map((option) => (
            <label key={option} className="custom-dropdown-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleOptionChange(e, option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
