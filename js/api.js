async function getExercises() {
  const response = await fetch('/.netlify/functions/exercises');

  if (!response.ok) {
    throw new Error('Failed to load exercises');
  }

  return response.json();
}

async function getProgress(exerciseId) {
  const response = await fetch(
    `/.netlify/functions/progress?exerciseId=${exerciseId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load progress');
  }

  return data;
}

async function saveFitnessTest(exerciseId, reps) {
  const response = await fetch('/.netlify/functions/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exerciseId,
      reps
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to save test');
  }

  return data;
}

async function completeWorkout(exerciseId) {
  const response = await fetch('/.netlify/functions/workouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exerciseId
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to complete workout');
  }

  return data;
}
