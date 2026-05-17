/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
    await knex.schema.createTable('spare_parts', (t) => {
        t.increments('part_id');
        t.string('name', 150).notNullable();
        t.enu('category', ['electrical', 'mechanical', 'display', 'cable', 'connector', 'other']).notNullable();
        t.string('unit', 20).notNullable().defaultTo('ชิ้น');
        t.integer('stock_qty').notNullable().defaultTo(0);
        t.integer('min_stock').notNullable().defaultTo(5);
        t.decimal('cost_per_unit', 10, 2).notNullable().defaultTo(0);
        t.timestamp('created_at').defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('part_requests', (t) => {
        t.increments('request_id');
        t.integer('ticket_id').unsigned().notNullable();
        t.integer('tech_id').unsigned().notNullable();
        t.integer('part_id').unsigned().notNullable();
        t.integer('qty_requested').notNullable();
        t.integer('qty_approved').nullable();
        t.enu('status', ['pending', 'approved', 'rejected', 'returned']).notNullable().defaultTo('pending');
        t.timestamp('requested_at').defaultTo(knex.fn.now());
        t.integer('approved_by').unsigned().nullable();
        t.timestamp('approved_at').nullable();
        t.text('notes')

        t.foreign('ticket_id')
         .references('ticket_id')
         .inTable('maintenance_tickets')
         .onDelete('CASCADE');

        t.foreign('tech_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE')

        t.foreign('part_id')
         .references('part_id')
         .inTable('spare_parts')
         .onDelete('CASCADE')

        t.foreign('approved_by')
         .references('user_id')
         .inTable('users')
         .onDelete('SET NULL')
    })


    await knex.schema.createTable('repair_proposals', (t) => {
        t.increments('proposal_id');
        t.integer('ticket_id').unsigned().notNullable();
        t.integer('tech_id').unsigned().notNullable();
        t.enu('recommendation', ['repair', 'replace']).notNullable();
        t.decimal('repair_cost_estimate', 10,2).nullable();
        t.decimal('replace_cost_estimate', 10,2).nullable();
        t.decimal('estimated_time_hours', 4,1).nullable();
        t.text('description').notNullable();
        t.string('evidence_image', 500).nullable();
        t.enu('status', ['pending','approved_repair','approved_replace','rejected']).defaultTo('pending').notNullable();
        t.integer('reviewed_by').unsigned().nullable();
        t.timestamp('reviewed_at').nullable();
        t.text('admin_note');
        t.timestamp('created_at').defaultTo(knex.fn.now());

        t.foreign('ticket_id')
         .references('ticket_id')
         .inTable('maintenance_tickets')
         .onDelete('CASCADE');

        t.foreign('tech_id')
         .references('user_id')
         .inTable('users')
         .onDelete('CASCADE');

        t.foreign('reviewed_by')
         .references('user_id')
         .inTable('users')
         .onDelete('SET NULL')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('repair_proposals');
  await knex.schema.dropTableIfExists('part_requests');
  await knex.schema.dropTableIfExists('spare_parts');
};
