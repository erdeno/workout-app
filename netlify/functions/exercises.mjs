import {
  getDatabaseUser,
  sql
} from './lib/auth-user.mjs';

export default async () => {
  try {
    const user = await getDatabaseUser();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const exercises = await sql`
      SELECT
        e.id,
        e.slug,
        e.name,
        e.goal_reps,
        p.current_level,
        p.current_workout,
        p.last_test_reps,
        p.goal_reached,
        p.needs_retest
      FROM exercises e
      LEFT JOIN user_exercise_progress p
        ON p.exercise_id = e.id
        AND p.user_id = ${user.id}
      ORDER BY e.id
    `;

    return Response.json({
      ok: true,
      exercises
    });

  } catch (error) {
    console.error('EXERCISES ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
};
