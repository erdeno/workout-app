const { sql } = require('./lib/db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { exerciseId, reps } = JSON.parse(event.body || '{}');

    if (!Number.isInteger(exerciseId) || !Number.isInteger(reps) || reps < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid exerciseId or reps' })
      };
    }

    // Temporary development user until Google login is added.
    const users = await sql`
      INSERT INTO users (google_id, email, name)
      VALUES ('dev-user', 'dev@example.com', 'Development User')
      ON CONFLICT (google_id)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    const userId = users[0].id;

    const rules = await sql`
      SELECT level
      FROM level_rules
      WHERE exercise_id = ${exerciseId}
        AND min_test_reps <= ${reps}
        AND (
          max_test_reps IS NULL
          OR max_test_reps >= ${reps}
        )
      ORDER BY level
      LIMIT 1
    `;

    if (rules.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'No level rule found for this result'
        })
      };
    }

    const assignedLevel = rules[0].level;

    await sql`
      INSERT INTO fitness_tests (
        user_id,
        exercise_id,
        reps,
        assigned_level
      )
      VALUES (
        ${userId},
        ${exerciseId},
        ${reps},
        ${assignedLevel}
      )
    `;

    await sql`
      INSERT INTO user_exercise_progress (
        user_id,
        exercise_id,
        current_level,
        current_workout,
        last_test_reps
      )
      VALUES (
        ${userId},
        ${exerciseId},
        ${assignedLevel},
        1,
        ${reps}
      )
      ON CONFLICT (user_id, exercise_id)
      DO UPDATE SET
        current_level = EXCLUDED.current_level,
        current_workout = 1,
        last_test_reps = EXCLUDED.last_test_reps,
        updated_at = NOW()
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        reps,
        assignedLevel
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to save test'
      })
    };
  }
};
