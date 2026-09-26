import {
  getDatabaseUser,
  sql
} from './lib/auth-user.mjs';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const user = await getDatabaseUser();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      exerciseId,
      reps
    } = await req.json();

    if (
      !Number.isInteger(exerciseId) ||
      !Number.isInteger(reps) ||
      reps < 0
    ) {
      return Response.json(
        { error: 'Invalid exerciseId or reps' },
        { status: 400 }
      );
    }

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
      return Response.json(
        { error: 'No matching level found' },
        { status: 400 }
      );
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
        ${user.id},
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
        last_test_reps,
        needs_retest
      )
      VALUES (
        ${user.id},
        ${exerciseId},
        ${assignedLevel},
        1,
        ${reps},
        FALSE
      )
      ON CONFLICT (user_id, exercise_id)
      DO UPDATE SET
        current_level = EXCLUDED.current_level,
        current_workout = 1,
        last_test_reps = EXCLUDED.last_test_reps,
        needs_retest = FALSE,
        updated_at = NOW()
    `;

    return Response.json({
      ok: true,
      reps,
      assignedLevel
    });

  } catch (error) {
    console.error('TEST ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
};
