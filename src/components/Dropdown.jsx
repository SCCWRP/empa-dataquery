import React from 'react';

function Dropdown({ label, options, selectedValue, onChange, id }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <select multiple  id={id} value={selectedValue} onChange={onChange}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown