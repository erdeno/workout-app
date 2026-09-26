const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    await sql`
      ALTER TABLE user_exercise_progress
      ADD COLUMN IF NOT EXISTS needs_retest BOOLEAN NOT NULL DEFAULT FALSE
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
