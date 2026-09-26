import {
  getDatabaseUser,
  sql
} from './lib/auth-user.mjs';

export default async (req) => {
  try {
    const user = await getDatabaseUser();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const exerciseId =
      Number(url.searchParams.get('exerciseId'));

    if (!Number.isInteger(exerciseId)) {
      return Response.json(
        { error: 'Invalid exerciseId' },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT
        current_level,
        current_workout,
        last_test_reps,
        goal_reached,
        needs_retest
      FROM user_exercise_progress
      WHERE user_id = ${user.id}
        AND exercise_id = ${exerciseId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({
        ok: true,
        hasProgress: false
      });
    }

    const progress = rows[0];

    if (progress.needs_retest) {
      return Response.json({
        ok: true,
        hasProgress: true,
        needsRetest: true,
        progress,
        workout: null
      });
    }

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

    return Response.json({
      ok: true,
      hasProgress: true,
      needsRetest: false,
      progress,
      workout: workoutRows[0] || null
    });

  } catch (error) {
    console.error('PROGRESS ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
};
