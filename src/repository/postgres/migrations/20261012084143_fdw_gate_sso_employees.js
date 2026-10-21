/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  //
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  //
};

/**
 CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS gate_sso_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'localhost', port '5432', dbname 'gate_sso');


CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
    SERVER gate_sso_server
    OPTIONS (user 'msiserver', password 'Rubysa179596!');


CREATE FOREIGN TABLE IF NOT EXISTS gate_sso_employees (
      employee_id uuid,
      employee_name varchar(255),
      employee_email varchar(255),
      employee_id_netsuite varchar(255)
    )
    SERVER gate_sso_server
    OPTIONS (schema_name 'public', table_name 'employees');
 */
