<template>
  <div id="interval-trainer">
    <!-- <div>current state: {{ getCurrentState().value }}</div> -->
    <!-- <div>{{ getCurrentState().context.userInput }}</div> -->
    <settings-modal v-if="getCurrentState().matches('modal')"></settings-modal>
    <progress-bar></progress-bar>
    <div v-if="getCurrentState().matches('complete')" class='completion-screen'>
      <div class="dialog-box">
        <h1>You made it! 🎉🎉</h1>
        <p>Would you like to play again with the same questions?</p>
        <button class="btn btn-dialog" id="restart"
        v-on:click="send('CLICK', $event)">Yes, please!</button>
        <!-- <button class="btn">No, get me out of here!</button> -->
      </div>
    </div>
    <div v-else id='question-display'>
      <div id="question-wrapper">
        <h1 class="question">Please fill in the missing notes</h1>
        <!-- <div class="music-render" id="boo"></div> -->
        <music-display></music-display>
        <div class="play-button-wrapper">
          <play-button v-on:click.native="play"/>
        </div>
      </div>
    </div>
    
    <Footer></Footer>
  </div>
</template>

<script>
import ProgressBar from "@/components/interval-trainer/ProgressBar";
import PlayButton from "@/components/interval-trainer/PlayButton";
import MusicDisplay from "@/components/interval-trainer/MusicDisplay";
import SettingsModal from "@/components/interval-trainer/SettingsModal";
import Footer from "@/components/interval-trainer/Footer";
import { getters, mutations } from '@/store/store.js';
import { player } from "@/plugins/magenta";

export default {
  components: { ProgressBar, PlayButton, SettingsModal, MusicDisplay, Footer },
  created() {
    getters.quizService.onTransition(state=> {
      this.setState(state);
      if(this.getCurrentState().matches('displayQuestion')) {
        this.play();
      }
    }).start();
  },
  computed: {
    getCurrentState() {
      return getters.state;
    }
  },
  data() {
    return {
    }
  },
  methods: {
    send(event, nativeEvent) {
      const eventObj = {
        type: event,
        selectedButton: nativeEvent
      }
      // console.log(nativeEvent.target.dataset.interval);
      getters.quizService.send(eventObj);
    },
    setState: mutations.setState,
    play() {
      var currentQuestion = this.getCurrentState().context.currentQuestion; // not a fan that the current question is pulled every time play button is hit
      if(player.isPlaying()) {
        player.stop();
      }
      player.start(currentQuestion);
    }
  }
}
</script>


<style lang="scss" scoped>
  #interval-trainer {
    padding-top: 40px;
    height: 85vh;
    display: grid;
    // flex-direction: column;
    // justify-content: space-between;
    overflow: visible;
  }

  #question-display {
    // margin-top: 240px; // probably need to write additional media queries
    display: grid;
    grid-template-columns: repeat(100, 1fr);
    // grid-template-rows: repeat(100, 1fr);
    // column-gap: 38px;
  }

  #question-wrapper {
    grid-column: 51/52; // basically place the question wrapper in the middle of the page
    display: grid;
    grid-template-columns: 450px 100px;
    grid-template-rows: 50px 120px;
  }

  .question {
    text-align: left;
    margin: 0;
    font-size: 1.75rem;
    grid-column-start: 1;
    grid-column-end: 3;
  }

  .play-button-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
  }

</style>
