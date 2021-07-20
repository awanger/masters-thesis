<template>
  <div class="music-render">
    <div id="boo"></div>
    <!-- <command-box v-model="userInput"></command-box> -->
    <label>
      <input v-on:keyup="parse" v-model="userInput" type="text" placeholder="Type in a note name">
    </label>
  </div>
</template>


<script>
import { getters, mutations, actions } from '@/store/store.js';
import Vex from 'vexflow';
const VF = Vex.Flow;

export default {
  name: "",
  components: {},
  computed: {
    getCurrentState() {
      return getters.state;
    },
  },
  data() {
    return {
      userInput: ''
    }
  },
  mounted() {
    let referenceNoteName = this.getCurrentState().context.currentQuestion.notes[0].getNoteName();
    let referenceNote = new VF.StaveNote({clef: "treble", keys: [`${referenceNoteName}/4`], duration: "w" });

    // console.log(referenceNote);
    
    var array1 = [referenceNote];
    var array2 = [];
    this.drawCanvas(array1, array2);
  },
  methods: {
    ...mutations,
    ...actions,
    send(event, nativeEvent) {
      const eventObj = {
        type: event,
        selectedButton: nativeEvent
      }
      // console.log(eventObj);
      getters.quizService.send(eventObj);
    },
    parseAndRedraw() {
      },
    tokenize(str) {
      return str.split(" ");
    },
    isNoteName(char) {
      const validNotes = ['a', 'b','c','d','e','f','g']
      return validNotes.includes(char);
    },
    isValidDuration(char) {
      const validDuration = ['w', 'q','h'];
      return validDuration.includes(char);
    },
    parse(event) { // extract the note
      // console.log('the user input is: ' + this.userInput);
      // ignore everything except for alphanumeric keys
      // console.log("the input I will parse is: " + this.userInput);
      console.log(event);
      var referenceNoteName = this.getCurrentState().context.currentQuestion.notes[0].getNoteName();
      var referenceNote = new VF.StaveNote({clef: "treble", keys: [`${referenceNoteName}/4`], duration: "w" });
      var userNoteArray = [];

      var tokenizedResults = this.tokenize(this.userInput);
      // console.log(tokenizedResults);

      if(this.userInput != '') {
        // console.log('the user input is: ' + this.userInput);
        const regexp = /^[a-gA-G][#-]?(\/[wqhe])?$/;
        const matchSlashRegExp = /\//;
        // const sharpSymbol = /#/;
        // let duration;
        for(var i=0; i<tokenizedResults.length;i++) {
          let token = tokenizedResults[i];
          let inputtedNoteName = token[0];
          let duration = 'q'; // if the user doesn't specify duration, the default is quarter note
          let userNote;

          if(regexp.test(token)) { // if the user token matches the regular expression
            if(matchSlashRegExp.test(token)) { // if there is a / character in the expression
              let userInputDuration = token.split('/')[1]; // user inputted duration value
              if(userInputDuration == 'e') { // if the duration value is an eighth note
                // console.log('you typed an eighth note bitch!');
                duration = '8';
              } else {
                duration = userInputDuration; // grab the duration value in the token
              }
            }
            // if there is a sharp symbol
            if(/#/.test(token)) {
              userNote = new VF.StaveNote({clef: "treble", keys: [`${inputtedNoteName}/4`], duration: `${duration}` }).addAccidental(0, new VF.Accidental("#"));
            } else if(/-/.test(token)) { // if there is a flat symbol
              userNote = new VF.StaveNote({clef: "treble", keys: [`${inputtedNoteName}/4`], duration: `${duration}` }).addAccidental(0, new VF.Accidental("b"));
              console.log('you entered a flat symbol----------------------');
            } else {
              userNote = new VF.StaveNote({clef: "treble", keys: [`${inputtedNoteName}/4`], duration: `${duration}` });
            }
            userNoteArray.push(userNote);
          }
        }
      }
      this.redraw([referenceNote], userNoteArray);
    },
    redraw(noteArray1, noteArray2) {
      var oldBoo = document.getElementById("boo");
      var newBoo = document.createElement("div");
      var musicRenderer = document.querySelector('.music-render');

      newBoo.id = "boo";
      oldBoo.remove();

      musicRenderer.prepend(newBoo);
      this.drawCanvas(noteArray1, noteArray2);
      // console.log("the extracted note is: " + secondNote);
    },
    drawMeasure(context, noteArray, x, y, width) {
      var staveMeasure = new VF.Stave(x, y, width);
      var notesMeasure = [];

      for(var i=0; i < noteArray.length; i++) {
        // var noteName = noteArray[i];
        var note = noteArray[i];
        notesMeasure.push(note);
      }

      if(notesMeasure.length === 0 && this.userInput === '') {
        // console.log('measure is empty');
        staveMeasure.setContext(context).draw();
      } else {
        if(x===0) { // if it's the first measure being drawn
          staveMeasure.addClef("treble").addTimeSignature("4/4").setContext(context).draw();
        } else {
          staveMeasure.setContext(context).draw();
        }
        VF.Formatter.FormatAndDraw(context, staveMeasure, notesMeasure);
      }
    },
    drawCanvas(noteArray1, noteArray2) {
      var renderer = new VF.Renderer(document.getElementById("boo"), VF.Renderer.Backends.SVG);
      var noteArrays = [noteArray1, noteArray2];

      renderer.resize(500, 100);
      let context = renderer.getContext();
      var width = 220;

      for(var i=0; i < noteArrays.length; i++) {
        var x = width*i;
        var y = 0;
        this.drawMeasure(context, noteArrays[i], x, y, width);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .music-render {
    display: grid;
    grid-template-columns: 220px 220px 200px; // 250px 
    grid-template-rows: repeat(2, 1fr);
  }

  #boo {
    grid-column: 1/3;
    grid-row: 1/2;
  }

  label {
    position: relative;
    grid-column: 2/3;
    grid-row: 2/3;
  }

  label:before {
    content: "";
    position: absolute;
    left: 1px;
    top: 0;
    bottom: 0;
    width: 20px;
    background: url('https://upload.wikimedia.org/wikipedia/commons/6/6f/Ic_chevron_right_48px.svg') center / contain no-repeat;
  }

  input {
    border: 3px solid #D6E1E5; // I wonder if there's a way to gain access to the variable
    border-radius: 3px;
    width: 220px;
    padding: 2% 8%;
    &:focus {
      outline: none !important;
      border: 3px solid #02BAF2;
      // box-shadow: 0 0 10px #02BAF2;
    }
  }
  
</style>