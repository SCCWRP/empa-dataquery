import React from 'react';

const Header = () => {
  return (
    <header>
      <h1>EMPA Advanced Query Tool</h1>
      <p>Design your query in the following order:</p>
      <ol>
        <li>Select a region, hit Confirm when you are done with your selections</li>
        <li>Subset further based on what is returned</li>
        <li>Select "Download Data" to download the results.</li>
      </ol>
    </header>
  );
}

export default Header;
