import './App.css'
import { useEffect } from 'react'
import * as duckdb from "@duckdb/duckdb-wasm"

export default function App(){
  useEffect(() => {
    async function runSQL(){
      // Select the best available version of DuckDB-WASM
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

        console.log("Query Result:");
        console.table(result.toArray());
    }
    runSQL();
  }, []);

  return (
    <div style ={{ padding: "2rem"}}>
      <h2> SQL Join Visualizer (Prototype)</h2>
      <p>Open your browser console to see query output!</p>
    </div>
  );
}
