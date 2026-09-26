const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    const users = await sql`
      SELECT id
      FROM users
      WHERE google_id = 'dev-user'
      LIMIT 1
    `;

    const userId = users[0]?.id || null;

    const exercises = await sql`
      SELECT
        e.id,
        e.slug,
        e.name,
        e.goal_reps,

        p.current_level,
        p.current_workout,
        p.last_test_reps,
        p.goal_reached

      FROM exercises e

      LEFT JOIN user_exercise_progress p
        ON p.exercise_id = e.id
        AND p.user_id = ${userId}

      ORDER BY e.id
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        exercises
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to load exercises'
      })
    };
  }
};
