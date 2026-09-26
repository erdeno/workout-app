async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function getCurrentUser() {
  return apiRequest('/.netlify/functions/auth-me');
}

async function registerUser(name, email, password) {
  return apiRequest('/.netlify/functions/auth-signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      email,
      password
    })
  });
}

async function loginUser(email, password) {
  return apiRequest('/.netlify/functions/auth-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password
    })
  });
}

async function logoutUser() {
  return apiRequest('/.netlify/functions/auth-logout', {
    method: 'POST'
  });
}

async function getExercises() {
  return apiRequest('/.netlify/functions/exercises');
}

async function getProgress(exerciseId) {
  return apiRequest(
    `/.netlify/functions/progress?exerciseId=${exerciseId}`
  );
}

async function saveFitnessTest(exerciseId, reps) {
  return apiRequest('/.netlify/functions/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exerciseId,
      reps
    })
  });
}

async function completeWorkout(exerciseId) {
  return apiRequest('/.netlify/functions/workouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exerciseId
    })
  });
}
