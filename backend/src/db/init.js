const fs = require('node:fs');
const path = require('node:path');
const db = require('../config/database');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema);

console.log(`Base de datos inicializada en: ${db.name}`);
