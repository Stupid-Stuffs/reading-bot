require("dotenv").config();
const { Pool } = require("pg");
const config = {
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  // this object will be passed to the TLSSocket constructor
  ssl: {
    rejectUnauthorized: false,
  },
};
const pool = new Pool(config);
module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
};
