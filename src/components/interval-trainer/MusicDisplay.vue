<template>
  <div class="music-render">
    <label for="measure-1">
      <input v-on:keyup="parse" v-on:keydown="preventDefaultArrowKeyBehavior" type="text" placeholder="Type in a note name" id="measure-1">
    </label>
    <label for="measure-2">
      <input v-on:keyup="parse" type="text" placeholder="Type in a note name" id="measure-2">
    </label>
    <label for="measure-3">
      <input v-on:keyup="parse" type="text" placeholder="Type in a note name" id="measure-3">
    </label>
    <label for="measure-4">
      <input v-on:keyup="parse" type="text" placeholder="Type in a note name" id="measure-4">
    </label>
    <div id="boo"></div>
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
      measure1: [],
      measure2: [],
      measure3: [],
      measure4: []
    }
  },
  mounted() {   
    this.drawCanvas([this.measure1, this.measure2, this.measure3, this.measure4]); // so unrefined
  },
  methods: {
    ...mutations,
    ...actions,
    send(event, nativeEvent) {
      const eventObj = {
        type: event,
        selectedButton: nativeEvent
      }
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
      const validexp = /^([a-gA-G][#-]?|r)[1-9]?([(_)|(__)]*|[\\]*|[.])$/
      return validexp.test(token);
    },
    parseDot(token) {
      const dotRegExp = /[.]/g;
      if(dotRegExp.test(token)) {
        return true;
      } else {
        return false;
      }
    },
    parseNoteDuration(token) {
      const flagRegExp = /(\\)+/g; // if the user input contains one or more occurrences of a backslash
      const dashesRegExp = /(_)|(__)/g  ; // if the user input contains exactly one or exactly two dashes
      
      if(flagRegExp.test(token)) {
        let numFlags = token.split('\\').length-1;
        if(numFlags === 1) {
          return '8';
        } else if (numFlags === 2) {
          return '16';
        } else if (numFlags === 3) {
          return '32';
        }
      } else if(dashesRegExp.test(token)) {
        let numDashes = token.split('_').length-1;
        if(numDashes == 1) {
          return 'h'; // half note
        } else if(numDashes == 2) {
          return 'w'; // whole note
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
    createNoteOrRest(name, accidental, octave, duration, hasDot) {
      let note;
      if(name == 'r') {
        note = new VF.StaveNote({clef: "treble", keys: ['b/4'], duration: `${duration}r` });
      } else {
        note = new VF.StaveNote({clef: "treble", keys: [`${name}/${octave}`], duration: `${duration}` });
      }
      // modifiers
      if(accidental) {
        note.addAccidental(0, new VF.Accidental(`${accidental}`));
      }
      if(hasDot) {
        note.addDot(0);
      }
  
      return note;
    },
    preventDefaultArrowKeyBehavior(event) {
      let key = event.key;
      if(key == 'ArrowUp' || key == 'ArrowDown') {
        event.preventDefault();
      }
    },
    parse(event) {
      let inputBoxID = event.target.id;
      let userInput = event.target.value;
      let tokenizedResults = this.tokenize(userInput);
      let noteArray = [];
      
      if(this.userInput != '') {
        for(var i=0; i<tokenizedResults.length;i++) {
          let token = tokenizedResults[i];
          if(this.isValidExpression(token)) {
            let noteOrRestName = token[0];
            let octave = this.parseOctaveNumber(token);
            let accidental = this.parseAccidentals(token);
            let duration = this.parseNoteDuration(token);
            let hasDot = this.parseDot(token); // the dot has to be parsed separately from note duration because of VexFlow's addDot() method
            let noteOrRest = this.createNoteOrRest(noteOrRestName, accidental, octave, duration, hasDot);
            noteArray.push(noteOrRest);
          }
        }
      }

      // transpose any notes when the user presses the up or down arrow keys
      if(event.key == 'ArrowUp' || event.key == 'ArrowDown') {
        let oldNote = noteArray[0];
        let oldNoteName = oldNote.keys[0].split('/')[0];
        let oldOctaveNumber = parseInt(oldNote.keys[0].split('/')[1]);
        let transposedOctaveNumber = (oldOctaveNumber+1).toString();
        let newNoteName = oldNoteName + '/' + transposedOctaveNumber;
        
        let transposedNote = new VF.StaveNote({clef: "treble", keys: [`${newNoteName}`], duration: `${oldNote.duration}`})
        noteArray[0] = transposedNote;
        // console.log(noteArray[0]);

        // probably update the input box in the event the user interface
        // delete the current octave number (if any) and then slap on the new one
        event.target.value = tokenizedResults[0] + transposedOctaveNumber;
        // console.log(event.target.value);

      }


      // refactor this later
      if(inputBoxID === 'measure-1') {
        this.measure1 = noteArray;
      } else if(inputBoxID === 'measure-2') {
        this.measure2 = noteArray;
      } else if(inputBoxID === 'measure-3') {
        this.measure3 = noteArray;
      } else if(inputBoxID === 'measure-4') {
        this.measure4 = noteArray;
      }
      this.redraw([this.measure1, this.measure2, this.measure3, this.measure4]);
    },
    deleteCanvas() {
      var oldBoo = document.getElementById("boo");
      var newBoo = document.createElement("div");
      var musicRenderer = document.querySelector('.music-render');

      newBoo.id = "boo";
      oldBoo.remove();

      musicRenderer.prepend(newBoo);
    },
    redraw(noteArrays) {
      this.deleteCanvas();
      this.drawCanvas(noteArrays);
      // console.log("the extracted note is: " + secondNote);
    },
    drawMeasure(context, noteArray, x, y, width) {
      let staveMeasure = new VF.Stave(x, y, width);
      let notesMeasure = [];

      for(var i=0; i < noteArray.length; i++) {
        let note = noteArray[i];
        notesMeasure.push(note);
      }

      if(x===0) {
        staveMeasure.addClef("treble").addTimeSignature("4/4").setContext(context).draw();
      } else {
        staveMeasure.setContext(context).draw(); // just draw empty measures
      }
      if (notesMeasure.length != 0){
        VF.Formatter.FormatAndDraw(context, staveMeasure, notesMeasure);
      }
    },
    drawCanvas(noteArrays) {
      var renderer = new VF.Renderer(document.getElementById("boo"), VF.Renderer.Backends.SVG);
      renderer.resize(1000, 100);
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
    grid-row: 1/2;
    // grid-column: 1/3;
  }

  label {
    // position: relative;
    // grid-column: 2/3;
    grid-row: 2/3;

  }

  label:before {
    // content: "";
    // position: absolute;
    // left: 1px;
    // top: 0;
    // bottom: 0;
    // width: 20px;
    // background: url('https://upload.wikimedia.org/wikipedia/commons/6/6f/Ic_chevron_right_48px.svg') center / contain no-repeat;
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