const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    const exercises = [
      ['push-ups', 'Push-ups', 100],
      ['sit-ups', 'Sit-ups', 200],
      ['squats', 'Squats', 200],
      ['dips', 'Dips', 50],
      ['pull-ups', 'Pull-ups', 30]
    ];

    for (const [slug, name, goalReps] of exercises) {
      await sql`
        INSERT INTO exercises (slug, name, goal_reps)
        VALUES (${slug}, ${name}, ${goalReps})
        ON CONFLICT (slug)
        DO UPDATE SET
          name = EXCLUDED.name,
          goal_reps = EXCLUDED.goal_reps
      `;
    }

    const rows = await sql`
      SELECT id, slug, name, goal_reps
      FROM exercises
      ORDER BY id
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        exercises: rows
      })
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
