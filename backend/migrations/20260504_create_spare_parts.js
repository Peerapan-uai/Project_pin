exports.up = (knex) => knex.schema.createTable('spare_parts', (t) => {
  t.increments('id');
  t.string('name').notNullable();
  t.integer('stock').defaultTo(0);
  t.integer('min_stock').defaultTo(5);
  t.timestamps(true, true);
});

exports.down = (knex) => knex.schema.dropTable('spare_parts');

