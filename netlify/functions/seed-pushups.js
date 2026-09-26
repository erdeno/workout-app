const { sql } = require('./lib/db');

exports.handler = async () => {
  try {
    const exerciseRows = await sql`
      SELECT id
      FROM exercises
      WHERE slug = 'push-ups'
      LIMIT 1
    `;

    if (exerciseRows.length === 0) {
      throw new Error('Push-ups exercise not found');
    }

    const exerciseId = exerciseRows[0].id;

    /*
     * Initial/re-test classification.
     *
     * Level 1: 0-5
     * Level 2: 6-10
     * Level 3: 11-20
     * Level 4: 21-30
     * Level 5: 31-40
     * Level 6: 41+
     */
    const levelRules = [
      [1, 0, 5],
      [2, 6, 10],
      [3, 11, 20],
      [4, 21, 30],
      [5, 31, 40],
      [6, 41, null]
    ];

    for (const [level, minReps, maxReps] of levelRules) {
      await sql`
        INSERT INTO level_rules (
          exercise_id,
          level,
          min_test_reps,
          max_test_reps,
          workouts_in_level
        )
        VALUES (
          ${exerciseId},
          ${level},
          ${minReps},
          ${maxReps},
          6
        )
        ON CONFLICT (exercise_id, level)
        DO UPDATE SET
          min_test_reps = EXCLUDED.min_test_reps,
          max_test_reps = EXCLUDED.max_test_reps,
          workouts_in_level = EXCLUDED.workouts_in_level
      `;
    }

    /*
     * [level, workout, set1, set2, set3, set4, set5, rest]
     */
    const workouts = [

      // Level 1
      [1, 1, 2, 3, 2, 2, 3, 60],
      [1, 2, 3, 3, 2, 2, 4, 60],
      [1, 3, 3, 4, 3, 3, 4, 60],
      [1, 4, 4, 4, 3, 3, 5, 60],
      [1, 5, 4, 5, 4, 4, 5, 60],
      [1, 6, 5, 6, 4, 4, 6, 60],

      // Level 2
      [2, 1, 6, 7, 5, 5, 7, 60],
      [2, 2, 6, 8, 6, 6, 8, 60],
      [2, 3, 7, 9, 6, 6, 9, 60],
      [2, 4, 8, 10, 7, 7, 10, 60],
      [2, 5, 9, 11, 8, 8, 11, 60],
      [2, 6, 10, 12, 9, 9, 12, 60],

      // Level 3
      [3, 1, 11, 14, 9, 9, 13, 75],
      [3, 2, 12, 15, 10, 10, 14, 75],
      [3, 3, 13, 16, 11, 11, 15, 75],
      [3, 4, 14, 18, 12, 12, 16, 75],
      [3, 5, 15, 19, 13, 13, 18, 75],
      [3, 6, 16, 20, 14, 14, 20, 75],

      // Level 4
      [4, 1, 18, 22, 15, 15, 21, 90],
      [4, 2, 19, 24, 16, 16, 23, 90],
      [4, 3, 20, 25, 17, 17, 25, 90],
      [4, 4, 22, 27, 18, 18, 27, 90],
      [4, 5, 23, 29, 20, 20, 29, 90],
      [4, 6, 25, 31, 21, 21, 31, 90],

      // Level 5
      [5, 1, 27, 33, 22, 22, 33, 90],
      [5, 2, 28, 35, 24, 24, 35, 90],
      [5, 3, 30, 37, 25, 25, 37, 90],
      [5, 4, 32, 40, 27, 27, 40, 90],
      [5, 5, 34, 42, 29, 29, 42, 90],
      [5, 6, 36, 45, 30, 30, 45, 90],

      // Level 6
      [6, 1, 38, 48, 32, 32, 48, 120],
      [6, 2, 40, 50, 34, 34, 50, 120],
      [6, 3, 42, 53, 36, 36, 53, 120],
      [6, 4, 45, 56, 38, 38, 56, 120],
      [6, 5, 48, 60, 40, 40, 60, 120],
      [6, 6, 50, 63, 42, 42, 63, 120]
    ];

    for (const workout of workouts) {
      const [
        level,
        workoutNumber,
        set1,
        set2,
        set3,
        set4,
        set5,
        restSeconds
      ] = workout;

      await sql`
        INSERT INTO workout_templates (
          exercise_id,
          level,
          workout_number,
          set_1,
          set_2,
          set_3,
          set_4,
          set_5,
          rest_seconds
        )
        VALUES (
          ${exerciseId},
          ${level},
          ${workoutNumber},
          ${set1},
          ${set2},
          ${set3},
          ${set4},
          ${set5},
          ${restSeconds}
        )
        ON CONFLICT (exercise_id, level, workout_number)
        DO UPDATE SET
          set_1 = EXCLUDED.set_1,
          set_2 = EXCLUDED.set_2,
          set_3 = EXCLUDED.set_3,
          set_4 = EXCLUDED.set_4,
          set_5 = EXCLUDED.set_5,
          rest_seconds = EXCLUDED.rest_seconds
      `;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        exercise: 'push-ups',
        levels: levelRules.length,
        workouts: workouts.length
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
