import React from 'react';

const Header = () => {
  return (
    <header>
      <h1>EMPA Advanced Query Tool</h1>
      <p>Design your query in the following order:</p>
      <ol>
        <li>Select a region</li>
        <li>Subset further based on what is returned</li>
        <li>Select "Run Query" to view and download the results.</li>
      </ol>
    </header>
  );
}

export default Header;
