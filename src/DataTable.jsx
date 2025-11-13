export default function DataTable({
  title,
  rows,
  highlightKey,
  highlightedValues = [],
}) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>{title}</h3>
        <p>(empty)</p>
      </div>
    );
  }

  const columns = Object.keys(rows[0]);
  const highlightSet = new Set(highlightedValues);

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        borderRadius: "8px",
        backgroundColor: "#1e1e1e", // slightly different than main background
        boxShadow: "0 0 0 1px #333",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <table
        cellPadding="6"
        style={{
          marginTop: "0.5rem",
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  borderBottom: "1px solid #444",
                  textAlign: "left",
                  paddingBottom: "4px",
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isHighlighted =
              highlightKey && highlightSet.has(row[highlightKey]);
            return (
              <tr
                key={i}
                style={{
                  backgroundColor: isHighlighted ? "#33374a" : "transparent",
                  outline: isHighlighted ? "2px solid #6aa0ff" : "none",
                  outlineOffset: "-1px",
                  transition: "background-color 0.15s ease, outline 0.15s ease",
                }}
              >
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      paddingTop: "4px",
                      paddingBottom: "4px",
                    }}
                  >
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}