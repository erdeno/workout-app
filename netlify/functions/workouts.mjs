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
      exerciseId
    } = await req.json();

    if (!Number.isInteger(exerciseId)) {
      return Response.json(
        { error: 'Invalid exerciseId' },
        { status: 400 }
      );
    }

    const progressRows = await sql`
      SELECT
        current_level,
        current_workout,
        needs_retest
      FROM user_exercise_progress
      WHERE user_id = ${user.id}
        AND exercise_id = ${exerciseId}
      LIMIT 1
    `;

    if (progressRows.length === 0) {
      return Response.json(
        { error: 'Progress not found' },
        { status: 404 }
      );
    }

    const progress = progressRows[0];

    if (progress.needs_retest) {
      return Response.json(
        { error: 'Fitness test required' },
        { status: 409 }
      );
    }

    const templateRows = await sql`
      SELECT
        set_1,
        set_2,
        set_3,
        set_4,
        set_5
      FROM workout_templates
      WHERE exercise_id = ${exerciseId}
        AND level = ${progress.current_level}
        AND workout_number = ${progress.current_workout}
      LIMIT 1
    `;

    if (templateRows.length === 0) {
      return Response.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    const workout = templateRows[0];

    const totalReps =
      workout.set_1 +
      workout.set_2 +
      workout.set_3 +
      workout.set_4 +
      workout.set_5;

    await sql`
      INSERT INTO workout_history (
        user_id,
        exercise_id,
        level,
        workout_number,
        set_1,
        set_2,
        set_3,
        set_4,
        set_5,
        total_reps
      )
      VALUES (
        ${user.id},
        ${exerciseId},
        ${progress.current_level},
        ${progress.current_workout},
        ${workout.set_1},
        ${workout.set_2},
        ${workout.set_3},
        ${workout.set_4},
        ${workout.set_5},
        ${totalReps}
      )
    `;

    const ruleRows = await sql`
      SELECT workouts_in_level
      FROM level_rules
      WHERE exercise_id = ${exerciseId}
        AND level = ${progress.current_level}
      LIMIT 1
    `;

    const workoutsInLevel =
      ruleRows[0]?.workouts_in_level || 6;

    let needsRetest = false;
    let nextWorkout =
      progress.current_workout;

    if (
      progress.current_workout >=
      workoutsInLevel
    ) {
      needsRetest = true;

      await sql`
        UPDATE user_exercise_progress
        SET
          needs_retest = TRUE,
          updated_at = NOW()
        WHERE user_id = ${user.id}
          AND exercise_id = ${exerciseId}
      `;
    } else {
      nextWorkout =
        progress.current_workout + 1;

      await sql`
        UPDATE user_exercise_progress
        SET
          current_workout = ${nextWorkout},
          needs_retest = FALSE,
          updated_at = NOW()
        WHERE user_id = ${user.id}
          AND exercise_id = ${exerciseId}
      `;
    }

    return Response.json({
      ok: true,
      completedLevel:
        progress.current_level,
      completedWorkout:
        progress.current_workout,
      totalReps,
      nextWorkout,
      needsRetest
    });

  } catch (error) {
    console.error('WORKOUT ERROR:', error);

    return Response.json(
      {
        ok: false,
        error: error.message
      },
      { status: 500 }
    );
  }
};
