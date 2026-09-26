const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        goal_reps INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_exercise_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        current_level INTEGER NOT NULL DEFAULT 1,
        current_workout INTEGER NOT NULL DEFAULT 1,
        last_test_reps INTEGER,
        goal_reached BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, exercise_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS workout_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        level INTEGER NOT NULL,
        workout_number INTEGER NOT NULL,
        set_1 INTEGER NOT NULL,
        set_2 INTEGER NOT NULL,
        set_3 INTEGER NOT NULL,
        set_4 INTEGER NOT NULL,
        set_5 INTEGER NOT NULL,
        total_reps INTEGER NOT NULL,
        completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
