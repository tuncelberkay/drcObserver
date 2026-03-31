import { Client } from 'pg';
import mysql from 'mysql2/promise';
import oracledb from 'oracledb';

// Enable Oracle Thin Mode (Default in 6.0+)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function executeRawDbQuery(type: string, host: string, port: number, user: string, password: string, database: string, queryPayload: string) {
  if (type === "POSTGRESQL") {
    const client = new Client({
      host,
      port,
      user,
      password,
      database
    });

    try {
      await client.connect();
      const res = await client.query(queryPayload);
      return res.rows;
    } finally {
      await client.end().catch(console.error);
    }
  }

  if (type === "MYSQL" || type === "MARIADB") {
    let connection;
    try {
      connection = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database
      });
      const [rows] = await connection.execute(queryPayload);
      return rows;
    } finally {
      if (connection) await connection.end().catch(console.error);
    }
  }

  if (type === "ORACLE") {
    let connection;
    try {
      connection = await oracledb.getConnection({
        user,
        password,
        connectString: `${host}:${port}/${database}` // Easy Connect Syntax
      });
      const result = await connection.execute(queryPayload);
      return result.rows || [];
    } finally {
      if (connection) {
        try { await connection.close(); } catch (err) { console.error(err); }
      }
    }
  }

  throw new Error(`Execution environment for ${type} is not properly installed or supported.`);
}
