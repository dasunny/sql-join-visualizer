import './App.css'
import { useEffect, useState, useRef } from 'react'
import * as duckdb from "@duckdb/duckdb-wasm"

export default function App(){
  const [rows, setRows] = useState([]);
  const connRef = useRef(null);

  const[query, setQuery] = useState(`
    SELECT e.name, o.city
    FROM employees e
    JOIN offices o ON e.officeCode = o.officeCode;
    `);

  useEffect(() => {
    async function runSQL(){
      //tell duckdb where to find its wasm/worker files locally
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

      //Create the worker + database
      const worker = new Worker(bundle.mainWorker);
      const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
      await db.instantiate(bundle.mainModule);

      const conn = await db.connect();
      connRef.current = conn;

      //Creating some sample tables
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

      //Running a sample JOIN query

      const result = await conn.query(`
        SELECT e.name, o.city
        FROM employees e
        JOIN offices o ON e.officeCode = o.officeCode;
        `);

        const data = result.toArray().map(r => ({
          name: r.name,
          city: r.city,
        }));
        console.log("Query Result:", data);
        setRows(data);
    }
    runSQL();
  }, []);

  async function runUserQuery() {
    if (!connRef.current){
      alert("Database not ready yet!");
      return;
    }

    try {
      const result = await connRef.current.query(query);
      const data = result.toArray().map(r => Object.fromEntries(Object.entries(r)));
      console.log("User Query Result:", data);
      setRows(data);
    } catch (err) {
      console.error("SQL Error:", err);
      alert("There was an error running your query. Check the console.");
    }
  }
return (
  <div style={{ padding: "2rem" }}>
    <h2>SQL Join Visualizer (Prototype)</h2>
    <p>Open your browser console to see query output!</p>

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

    {rows.length > 0 && (
      <table border="1" cellPadding="6" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            {Object.keys(rows[0]).map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {Object.keys(rows[0]).map((col) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);
}
