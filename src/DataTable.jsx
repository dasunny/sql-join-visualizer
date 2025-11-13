export default function DataTable({ title, rows }) {
  // if rows is empty or undefined, show "(empty)"
  if (!rows || rows.length === 0) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>{title}</h3>
        <p>(empty)</p>
      </div>
    );
  }

  // get the column names from the first row
  const columns = Object.keys(rows[0]); 

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3>{title}</h3>
      <table border="1" cellPadding="6" style={{ marginTop: "0.5rem" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col}>{String(row[col])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




