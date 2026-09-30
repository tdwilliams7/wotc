import pg from "pg";
import { DATABASE_URL } from "./config";

export const pool = new pg.Pool({ connectionString: DATABASE_URL });
export type Db = pg.Pool | pg.PoolClient;
