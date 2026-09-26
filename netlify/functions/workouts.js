const { sql } = require('./lib/db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { exerciseId } = JSON.parse(event.body || '{}');

    if (!Number.isInteger(exerciseId)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid exerciseId' })
      };
    }

    // Temporary development user.
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
        current_workout
      FROM user_exercise_progress
      WHERE user_id = ${userId}
        AND exercise_id = ${exerciseId}
      LIMIT 1
    `;

    if (progressRows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Progress not found' })
      };
    }

    const progress = progressRows[0];

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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Workout not found' })
      };
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
        ${userId},
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

    const workoutsInLevel = ruleRows[0]?.workouts_in_level || 6;

    let needsRetest = false;
    let nextWorkout = progress.current_workout;

    if (progress.current_workout >= workoutsInLevel) {
      needsRetest = true;

      await sql`
        UPDATE user_exercise_progress
        SET
          needs_retest = TRUE,
          updated_at = NOW()
        WHERE user_id = ${userId}
          AND exercise_id = ${exerciseId}
      `;
    } else {
      nextWorkout = progress.current_workout + 1;

      await sql`
        UPDATE user_exercise_progress
        SET
          current_workout = ${nextWorkout},
          needs_retest = FALSE,
          updated_at = NOW()
        WHERE user_id = ${userId}
          AND exercise_id = ${exerciseId}
      `;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        completedLevel: progress.current_level,
        completedWorkout: progress.current_workout,
        totalReps,
        nextWorkout,
        needsRetest
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: 'Failed to complete workout'
      })
    };
  }
};
