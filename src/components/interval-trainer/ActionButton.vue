<template>
  <button class="btn btn-action" v-bind:class="{ incorrect: isIncorrectOrCompleted }">
    <div v-if="getCurrentState().matches('checked') || getCurrentState().matches('displayQuestion') || getCurrentState().matches('modal') ">
      Check
    </div>
    <div v-if="getCurrentState().matches('correct')">
      Continue
    </div>
    <div v-if="getCurrentState().matches('incorrect')">
      Try Again
    </div>
    <div v-if="getCurrentState().matches('complete')">
      Exit
    </div>
  </button>
</template>


<script>
import { getters, mutations, actions } from '@/store/store.js';

export default {
  name: "ActionButton",
  computed: {
    getCurrentState() {
      return getters.state;
    },
    isIncorrectOrCompleted() {
      return this.getCurrentState().matches('incorrect') || this.getCurrentState().matches('complete');
    },
    isEnabled() {
      return this.answerIsSelected() || this.getCurrentState().matches('complete');
    }
  },
  data() {
    return {
    }
  },
  methods: {
    ...mutations,
    ...actions,
    answerIsSelected() {
      return this.getCurrentState().context.selectedAnswer !== null;
    },
    send(event, nativeEvent) {
      const eventObj = {
        type: event,
        selectedButton: nativeEvent
      }
      getters.quizService.send(eventObj);
    }
  }
}
</script>



<style lang="scss" scoped>
  
</style>