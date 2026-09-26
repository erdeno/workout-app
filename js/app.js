const { createApp } = Vue;

createApp({
  data() {
    return {
      exercises: [],
      selectedExercise: null,

      screen: 'select',

      testReps: null,
      assignedLevel: null,

      progress: null,
      workout: null,

      sets: [],
      currentSetIndex: 0,

      restRemaining: 0,
      restTimer: null,

      completionResult: null,

      loading: true,
      error: null
    };
  },

  computed: {
    currentReps() {
      return this.sets[this.currentSetIndex] || 0;
    }
  },

  async mounted() {
    await this.loadExercises();
  },

  beforeUnmount() {
    clearInterval(this.restTimer);
  },

  methods: {
    async loadExercises() {
      try {
        this.loading = true;
        this.error = null;

        const data = await getExercises();
        this.exercises = data.exercises;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    selectExercise(exercise) {
      this.selectedExercise = exercise;
    },

    async continueExercise() {
      try {
        this.error = null;

        const data = await getProgress(this.selectedExercise.id);

        if (!data.hasProgress) {
          this.testReps = null;
          this.screen = 'test';
          return;
        }

        this.progress = data.progress;
        this.workout = data.workout;
        this.screen = 'workoutPreview';

      } catch (error) {
        this.error = error.message;
      }
    },

    async submitTest() {
      try {
        this.error = null;

        const reps = Number(this.testReps);

        const result = await saveFitnessTest(
          this.selectedExercise.id,
          reps
        );

        this.assignedLevel = result.assignedLevel;

        const data = await getProgress(this.selectedExercise.id);

        this.progress = data.progress;
        this.workout = data.workout;

        this.screen = 'result';

      } catch (error) {
        this.error = error.message;
      }
    },

    startWorkout() {
      this.sets = workoutSets(this.workout);
      this.currentSetIndex = 0;
      this.completionResult = null;
      this.screen = 'activeWorkout';
    },

    async finishSet() {
      if (this.currentSetIndex === 4) {
        clearInterval(this.restTimer);
        this.restTimer = null;

        try {
          this.error = null;

          this.completionResult = await completeWorkout(
            this.selectedExercise.id
          );

          const data = await getProgress(
            this.selectedExercise.id
          );

          this.progress = data.progress;
          this.workout = data.workout;

          await this.loadExercises();

          this.screen = 'workoutComplete';

        } catch (error) {
          this.error = error.message;
        }

        return;
      }

      this.currentSetIndex++;
      this.startRest();
    },

    startRest() {
      clearInterval(this.restTimer);

      this.restRemaining = this.workout.rest_seconds;
      this.screen = 'rest';

      this.restTimer = setInterval(() => {
        this.restRemaining--;

        if (this.restRemaining <= 0) {
          this.skipRest();
        }
      }, 1000);
    },

    skipRest() {
      clearInterval(this.restTimer);
      this.restTimer = null;
      this.screen = 'activeWorkout';
    },

    stopWorkout() {
      clearInterval(this.restTimer);
      this.restTimer = null;

      this.currentSetIndex = 0;
      this.screen = 'workoutPreview';
    },

    async finishCompletionScreen() {
      await this.loadExercises();

      this.selectedExercise = null;
      this.screen = 'select';
    }
  }
}).mount('#app');
