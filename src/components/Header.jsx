import React from 'react';

const Header = () => {
  return (
    <header>
      <h1>EMPA Advanced Query Tool</h1>
      <p>Design your query in the following order:</p>
      <ol>
        <li>Filter your data using the dropdowns.</li>
        <li>Upon pressing the Download Data button, you will get data in .xlsx files and corresponding FGDC metadata in XML files.</li>
        <li>Contact Paul Smith pauls@sccwrp.org or Duy Nguyen duyn@sccwrp.org for assistance in case there is an error.</li>
      </ol>
    </header>
  );
}

export default Header;
