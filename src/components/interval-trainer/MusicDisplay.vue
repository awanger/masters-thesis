<template>
  <div class="music-render">
    <div id="boo"></div>
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
    
    let array1 = [referenceNote];
    let array2 = [];
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
    getReferenceNote() {
      let referenceNoteName = this.getCurrentState().context.currentQuestion.notes[0].getNoteName();
      let referenceNote = new VF.StaveNote({clef: "treble", keys: [`${referenceNoteName}/4`], duration: "w" });
      return referenceNote;
    },
    tokenize(str) {
      return str.split(" ");
    },
    isValidExpression(token) {
      const validexp = /^([a-gA-G][#-]?|r)[1-9]?(\\)*$/;
      return validexp.test(token);
    },
    calculateNoteDuration(token, tokenPosition, numTokens) {
      if(numTokens === 1) {
        return 'w';
      }
    },
    parseNoteDuration(token) {
      const matchSlashRegExp = /(\\)+/g; // if there is one or more occurrences of a backslash
      if(matchSlashRegExp.test(token)) {
        let numFlags = token.split('\\').length-1;
        if(numFlags === 1) {
          return '8';
        } else if (numFlags === 2) {
          return '16';
        } else if (numFlags === 3) {
          return '32';
        }
      } else {
        return 'q'; // quarter note should be the default value
      }
    },
    parseOctaveNumber(token) {
      const octaveRegExp = /[1-9]/;
      let octaveNumber = 4; // default octave number 4
      if(octaveRegExp.test(token)) {
        octaveNumber = token.match(octaveRegExp);
      }
      return octaveNumber;
    },
    parseAccidentals(token) {
      const accidentalRegExp = /[#-]/;
      if(/-/.test(token)) {
        return 'b';
      } else {
        return token.match(accidentalRegExp);
      }
    },
    createNoteOrRest(name, accidental, octave, duration) {
      if(name == 'r') {
        return new VF.StaveNote({clef: "treble", keys: ['b/4'], duration: `${duration}r` });
      } else if(accidental) { 
        return new VF.StaveNote({clef: "treble", keys: [`${name}/${octave}`], duration: `${duration}` }).
        addAccidental(0, new VF.Accidental(`${accidental}`));
      } else {
        return new VF.StaveNote({clef: "treble", keys: [`${name}/${octave}`], duration: `${duration}` });
      }
    },
    parse() {
      let referenceNote = this.getReferenceNote();
      var tokenizedResults = this.tokenize(this.userInput);
      var noteArray = [];
      if(this.userInput != '') {
        for(var i=0; i<tokenizedResults.length;i++) {
          let token = tokenizedResults[i];
          if(this.isValidExpression(token)) {
            let noteOrRestName = token[0];
            let octave = this.parseOctaveNumber(token);
            let accidental = this.parseAccidentals(token);
            let duration = this.parseNoteDuration(token);
            let noteOrRest = this.createNoteOrRest(noteOrRestName, accidental, octave, duration);
            noteArray.push(noteOrRest);
            // console.log(noteArray);
          }
        }
      }
      this.redraw([referenceNote], noteArray);
    },
    deleteCanvas() {
      var oldBoo = document.getElementById("boo");
      var newBoo = document.createElement("div");
      var musicRenderer = document.querySelector('.music-render');

      newBoo.id = "boo";
      oldBoo.remove();

      musicRenderer.prepend(newBoo);
    },
    redraw(noteArray1, noteArray2) {
      this.deleteCanvas();
      this.drawCanvas(noteArray1, noteArray2);
      // console.log("the extracted note is: " + secondNote);
    },
    drawMeasure(context, noteArray, x, y, width) {
      let staveMeasure = new VF.Stave(x, y, width);
      let notesMeasure = [];

      for(var i=0; i < noteArray.length; i++) {
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
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    &:focus {
      outline: none !important;
      border: 3px solid #02BAF2;
      // box-shadow: 0 0 10px #02BAF2;
    }
  }
  
</style>