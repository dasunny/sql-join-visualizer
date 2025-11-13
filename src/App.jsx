import "./App.css";
import { useEffect, useState, useRef } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";

export default function App() {
  // rows = current query result (array of DuckDB row proxies)
  const [rows, setRows] = useState([]);
  // query text in the textarea
  const [query, setQuery] = useState(`
SELECT e.name, o.city
FROM employees e
JOIN offices o ON e.officeCode = o.officeCode;
`);
  // holds the DuckDB connection so we can reuse it
  const connRef = useRef(null);

  // run once on mount: start DuckDB, create tables, run default query
  useEffect(() => {
    async function runSQL() {
      // 1) tell duckdb where to find its wasm/worker files locally
      const BUNDLES = {
        mvp: {
          mainModule: new URL(
            "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm",
            import.meta.url
          ).toString(),
          mainWorker: new URL(
            "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js",
            import.meta.url
          ).toString(),
        },
        eh: {
          mainModule: new URL(
            "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm",
            import.meta.url
          ).toString(),
          mainWorker: new URL(
            "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js",
            import.meta.url
          ).toString(),
        },
      };

      const bundle = await duckdb.selectBundle(BUNDLES);

      // 2) create the worker + database
      const worker = new Worker(bundle.mainWorker);
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
      await db.instantiate(bundle.mainModule);

      // 3) open a connection and store it
      const conn = await db.connect();
      connRef.current = conn;

      // 4) create sample tables
      await conn.query(`
        CREATE TABLE employees (id INTEGER, name VARCHAR, officeCode INTEGER);
        INSERT INTO employees VALUES
          (1, 'ALICE', 1),
          (2, 'Bob', 2),
          (3, 'Charlie', 1);
      `);

      await conn.query(`
        CREATE TABLE offices (officeCode INTEGER, city VARCHAR);
        INSERT INTO offices VALUES
          (1, 'New York'),
          (2, 'San Francisco');
      `);

      // 5) run the default JOIN query (same as initial textarea)
      const initialResult = await conn.query(`
        SELECT e.name, o.city
        FROM employees e
        JOIN offices o ON e.officeCode = o.officeCode;
      `);

      const initialRows = initialResult.toArray(); // keep as row proxies
      console.log("Initial Query Result:", initialRows);
      setRows(initialRows);
    }

    runSQL();
  }, []);

  // handler for the "Run Query" button
  async function runUserQuery() {
    if (!connRef.current) {
      alert("Database not ready yet!");
      return;
    }

    try {
      const result = await connRef.current.query(query);
      const data = result.toArray(); // keep DuckDB's row proxies
      console.log("User Query Result:", data);
      setRows(data);
    } catch (err) {
      console.error("SQL Error:", err);
      alert("There was an error running your query. Check the console.");
    }
  }

  // figure out column names dynamically from the first row (if any)
  const columnNames =
    rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ padding: "2rem" }}>
      <h2>SQL Join Visualizer (Prototype)</h2>
      <p>Open your browser console to see query output!</p>

      {/* Query editor + Run button */}
      <div style={{ marginTop: "1rem" }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={6}
          cols={60}
          style={{ fontFamily: "monospace", fontSize: "1rem" }}
        />
        <br />
        <button onClick={runUserQuery} style={{ marginTop: "0.5rem" }}>
          Run Query
        </button>
      </div>

      {/* Result table */}
      {rows.length > 0 && (
        <table border="1" cellPadding="6" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              {columnNames.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columnNames.map((col) => (
                  <td key={col}>{String(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
