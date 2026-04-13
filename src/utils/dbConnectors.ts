import { Client } from 'pg';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';

// Enable Oracle Thin Mode (Default in 6.0+)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function executeRawDbQuery(type: string, host: string, port: number, user: string, password: string, database: string, queryPayload: string, ssl?: boolean) {
  const normType = type.toUpperCase() === "POSTGRES" ? "POSTGRESQL" : type.toUpperCase();
  
  if (normType === "POSTGRESQL") {
    const client = new Client({
      host: host ? String(host) : "localhost",
      port: Number(port) || 5432,
      user: user ? String(user) : undefined,
      password: () => (password === null || password === undefined ? "" : String(password)),
      database: database ? String(database) : undefined,
      ssl: ssl !== undefined ? (ssl ? { rejectUnauthorized: false } : undefined) : (host && host !== "localhost" && host !== "127.0.0.1" ? { rejectUnauthorized: false } : undefined)
    } as any);

    try {
      await client.connect();
      const res = await client.query(queryPayload);
      return res.rows;
    } finally {
      await client.end().catch(console.error);
    }
  }

  if (normType === "MYSQL" || normType === "MARIADB") {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: host ? String(host) : undefined,
        port: Number(port),
        user: user ? String(user) : undefined,
        password: password ? String(password) : undefined,
        database: database ? String(database) : undefined
      });
      const [rows] = await connection.execute(String(queryPayload));
      return rows;
    } finally {
      if (connection) await connection.end().catch(console.error);
    }
  }

  if (normType === "ORACLE") {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user: user ? String(user) : undefined,
        password: password ? String(password) : undefined,
        connectString: `${host}:${port}/${database}` // Easy Connect Syntax
      });
      const result = await connection.execute(String(queryPayload), [], { autoCommit: true });
      return result.rows || [];
    } finally {
      if (connection) {
        try { await connection.close(); } catch (err) { console.error(err); }
      }
    }
  }

  throw new Error(`Execution environment for ${normType} is not properly installed or supported.`);
}
