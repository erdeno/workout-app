const { sql } = require('./lib/db');

exports.handler = async (event) => {
  try {
    const exerciseId = Number(event.queryStringParameters?.exerciseId);

    if (!Number.isInteger(exerciseId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid exerciseId' })
      };
    }

    // Temporary dev user until Google login is added.
    const users = await sql`
      SELECT id
      FROM users
      WHERE google_id = 'dev-user'
      LIMIT 1
    `;

    if (users.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const userId = users[0].id;

    const progressRows = await sql`
      SELECT
        current_level,
        current_workout,
        last_test_reps,
        goal_reached
      FROM user_exercise_progress
      WHERE user_id = ${userId}
        AND exercise_id = ${exerciseId}
      LIMIT 1
    `;

    if (progressRows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          hasProgress: false
        })
      };
    }

    const progress = progressRows[0];

    const workoutRows = await sql`
      SELECT
        level,
        workout_number,
        set_1,
        set_2,
        set_3,
        set_4,
        set_5,
        rest_seconds
      FROM workout_templates
      WHERE exercise_id = ${exerciseId}
        AND level = ${progress.current_level}
        AND workout_number = ${progress.current_workout}
      LIMIT 1
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        hasProgress: true,
        progress,
        workout: workoutRows[0] || null
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to load progress'
      })
    };
  }
};
