const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS workout_templates (
        id SERIAL PRIMARY KEY,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

        level INTEGER NOT NULL,
        workout_number INTEGER NOT NULL,

        set_1 INTEGER NOT NULL,
        set_2 INTEGER NOT NULL,
        set_3 INTEGER NOT NULL,
        set_4 INTEGER NOT NULL,
        set_5 INTEGER NOT NULL,

        rest_seconds INTEGER NOT NULL DEFAULT 60,

        UNIQUE(exercise_id, level, workout_number)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS level_rules (
        id SERIAL PRIMARY KEY,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

        level INTEGER NOT NULL,

        min_test_reps INTEGER NOT NULL,
        max_test_reps INTEGER,

        workouts_in_level INTEGER NOT NULL DEFAULT 6,

        UNIQUE(exercise_id, level)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS fitness_tests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

        reps INTEGER NOT NULL,
        assigned_level INTEGER NOT NULL,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };
  }
};
