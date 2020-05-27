import React, { Component } from 'react';
import { connect } from "react-redux";
import { InputGroup, Button, FormGroup } from "@blueprintjs/core";
import { updateModel, updateElement, addModel, createElement, updateAddModel, selectElement } from "../../redux/actions";
import Group from './group';
import uuid from "uuid/v1"

const type = {
  STATE: 'state',
  PRESUBJECT: 'presubject',
  PREACTION: 'preaction',
  SUBJECT: 'subject',
  ACTION: 'action',
  NUMBER: 'number',
  LOGIC: 'logic',
  GUARD: 'guard',
  OPERATIONS: 'operations',
  OTHER: 'other'
}

const status = {
  GIVEN: 'given',
  WHEN: 'when',
  THEN: 'then'
}

class TextGroup extends Component {
  verbs = ["is", "are", "am", "gets", "in", "to", "shows", "was", "were"]; //pre action

  subject = ["the", "The"]; //if it gets a "the" in both given and then it can be the models name

  //extension = ["and"]; //if and is in the sentance look into it to see if it will extend anything, not implemented

  assignment = ["set", "sets", "="]; //to apply conditions, which means actions

  comparisons = ["higher", "lower", "above", "below", "<", ">", "==", "!=", "less", "more"];

  operations = ["adds", "subtracts", "multiplies", "divides", "+=", "-=", "*=", "/="];

  vertices = [];

  edges = [];

  variables = [];

  actions = [];

  hasNumber = (myString) => {
    return /\d/.test(myString);
  }

  isValue = (text) => {
    if (!isNaN(text)) {
      return type.NUMBER;
    }
    else if (text === "true" || text === "false") {
      return type.LOGIC;
    }
    else {
      return type.OTHER;
    }
  }

  restObj = (dictionary) => {
    var text = "";
    var found = false;
    for (let i = 0; i < dictionary.length; i++) {
      if (dictionary[i][1] === type.STATE) {
        found = true;
      }
      if (found) {
        if (dictionary[i][1] === type.OTHER) {
          text = text + dictionary[i][0] + " ";
        }
      }
    }
    return text;
  }

  retObj = (dictionary) => {
    var text = "";
    var found = false;
    for (let i = 0; i < dictionary.length; i++) {
      if (dictionary[i][1] === type.STATE) {
        found = true;
        text = text + dictionary[i][0] + " ";
      }
      if (found) {
        if (dictionary[i][1] === type.OTHER) {
          text = text + dictionary[i][0] + " ";
        }
      }
    }
    return text;
  }

  checkVertex = (vertex) => {
    for (let i = 0; i < this.vertices.length; i++) {
      if (vertex.name === this.vertices[i].name) {
        return this.vertices[i];
      }
    }
    return vertex;
  }
  //used to define a variable in the model, need to find way to add new actions
  createModelAction = (action) => {
    this.actions.push(action);
    var actionArr = [...this.actions];
    this.props.updateAddModel('actions', actionArr);
  }
  //used to change value of a variable, in a vertex
  createLocalAction = (action) => {
    this.props.updateElement('actions', action.split("\n"));
  }
  //used to define a guard, the guard should come from the when, can only contain one guard
  createGuard = (guard) => {
    this.props.updateElement('guard', guard);
  }

  checkEdge = (source, target) => {
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].sourceVertexId === source && this.edges[i].targetVertexId === target) {
        return false;
      }
    }
    return true;
  }

  createVertex = (name, amount) => {
    var vertex =
    {
      id: uuid(),
      name: name,
      properties: {
        x: 50 * amount,
        y: 50 * amount
      }
    }
    return vertex;
  }

  createEdge = (name, vertex_1, vertex_2) => {
    var edge =
    {
      id: uuid(),
      name: name,
      sourceVertexId: vertex_1,
      targetVertexId: vertex_2
    }
    return edge;
  }


  //add function to use interpreter to determine what the requirement wants
  //add functions to add actions, guards and maybe new pages.

  interpreter = (text) => {//add support to discover capital letters and such?
    if (this.verbs.includes(text)) {
      return type.STATE;
    }
    else if (this.subject.includes(text)) {
      return type.PRESUBJECT;//this should show before the subject in this requirement, however if there are two subjects in the same
      //requirement, should it interpretate what it want with both?
    }
    //else if (this.extension.includes(text)) {
    //  return type.EXTENSION;//remove if not anough time, could also be to run the function again but with only the text after and
    //}
    else if (this.assignment.includes(text)) {
      return type.PREACTION;
    }
    else if (this.comparisons.includes(text))
    {
      return type.GUARD;
    }
    else if (this.operations.includes(text))
    {
      return type.OPERATIONS;
    }
    else {
      return type.OTHER;
    }
  }

  modelDictionaryALT = (text, mode) => {
    var dictionary = Object.create(null);
    var dictionaryArr = [];
    var state = false;
    var action = false;
    var guard = false;
    var arr = text.split(" ");
    for (let i = 0; i < arr.length; i++) {
      var arrType = this.interpreter(arr[i]);
      if (mode === status.GIVEN) {
        if (state && arrType !== type.PREACTION) {
          dictionary[arr[i]] = type.OTHER;
        }
        else {
          if (arrType === type.STATE) {
            dictionary[arr[i]] = type.STATE;
            state = true;
          }
          else if (arrType === type.PREACTION) {
            dictionary[arr[i]] = type.PREACTION;
            state = false;
            action = true;
          }
          else if (arrType === type.PRESUBJECT) {
            dictionary[arr[i]] = type.PRESUBJECT;
            dictionaryArr.push([arr[i], dictionary[arr[i]]]);
            i++;
            dictionary[arr[i]] = type.SUBJECT;
          }
          else {
            if (dictionary[arr[i - 1]] === type.SUBJECT && arr[i].slice(-1) === 's') {
              dictionary[arr[i]] = type.STATE;
              state = true;
            }
            else {
              dictionary[arr[i]] = this.isValue(arr[i]);
            }
          }
        }
      }
      else if (mode === status.WHEN) {
        if (state && arrType !== type.GUARD) {
          dictionary[arr[i]] = type.OTHER;
        }
        else {
          if (arrType === type.STATE) {
            if ((dictionaryArr[0][1] === type.OTHER || dictionaryArr[0][1] === type.SUBJECT) && arr[i] === 'is') {
              dictionary[arr[i]] = type.GUARD;
              state = false;
              guard = true;
            }
            else {
              dictionary[arr[i]] = type.STATE;
              state = true;
            }
          }
          else if (arrType === type.PREACTION) {
            dictionary[arr[i]] = type.GUARD;
            state = false;
            guard = true;
          }
          else if (arrType === type.GUARD) {
            dictionary[arr[i]] = type.GUARD;
            state = false;
            guard = true;
            if (dictionaryArr[i - 1][0] === "is" && dictionaryArr[i - 1][1] === type.GUARD) {
              dictionaryArr[i - 1][1] === type.OTHER;
            }
          }
          else if (arrType === type.PRESUBJECT) {
            dictionary[arr[i]] = type.PRESUBJECT;
            dictionaryArr.push([arr[i], dictionary[arr[i]]]);
            i++;
            dictionary[arr[i]] = type.SUBJECT;
          }
          else {
            if (dictionary[arr[i - 1]] === type.SUBJECT && arr[i].slice(-1) === 's') {
              dictionary[arr[i]] = type.STATE;
              state = true;
            }
            else {
              dictionary[arr[i]] = this.isValue(arr[i]);
            }
          }
        }
      }
      else if (mode === status.THEN) {
        if (state && arrType !== type.PREACTION && arrType !== type.OPERATIONS) {
          dictionary[arr[i]] = type.OTHER;
        }
        else {
          if (arrType === type.STATE) {
            dictionary[arr[i]] = type.STATE;
            state = true;
          }
          else if (arrType === type.PREACTION) {
            dictionary[arr[i]] = type.PREACTION;
            state = false;
            action = true;
          }
          else if (arrType === type.OPERATIONS)
          {
            dictionary[arr[i]] = type.OPERATIONS;
            action = true;
            state = false
          }
          else if (arrType === type.PRESUBJECT) {
            dictionary[arr[i]] = type.PRESUBJECT;
            dictionaryArr.push([arr[i], dictionary[arr[i]]]);
            i++;
            dictionary[arr[i]] = type.SUBJECT;
          }
          else {
            if (dictionary[arr[i - 1]] === type.SUBJECT && arr[i].slice(-1) === 's') {
              dictionary[arr[i]] = type.STATE;
              state = true;
            }
            else {
              dictionary[arr[i]] = this.isValue(arr[i]);
            }
          }
        }
      }
      dictionaryArr.push([arr[i], dictionary[arr[i]]]);
    }
    if ((action === true || guard === true) && dictionaryArr[0][1] === type.OTHER) {
      dictionaryArr[0][1] = type.SUBJECT;
    }
    console.log("Model DictionaryALT: ");
    console.log(dictionaryArr);
    return dictionaryArr;
  }

  //could use a cleanup
  modelUpdater = (given, when, then) => {
    document.getElementById('error').innerHTML = "";
    console.log(given + when + then);
    var givenDictionary = this.modelDictionaryALT(given, status.GIVEN);
    var whenDictionary = this.modelDictionaryALT(when, status.WHEN);
    var thenDictionary = this.modelDictionaryALT(then, status.THEN);
    var givenSubjects = [];
    var whenSubjects = [];
    var thenSubjects = [];
    var givenState;
    var whenState;
    var thenState;
    var isAction = false;
    var isGuard = false;
    var isLocalAction = false;
    var action;
    var start;
    for (let i = 0; i < givenDictionary.length; i++) {
      switch (givenDictionary[i][1]) {
        case type.STATE:
          givenState = this.restObj(givenDictionary);
          break;
        case type.SUBJECT:
          givenSubjects.push(givenDictionary[i][0]);
          break;
        case type.PREACTION:
          isAction = true;
          break;
        case type.PRESUBJECT:
          break;
        case type.OTHER:
          break;
      }
    }
    for (let i = 0; i < whenDictionary.length; i++) {
      switch (whenDictionary[i][1]) {
        case type.STATE:
          whenState = this.retObj(whenDictionary);
          break;
        case type.ACTION:
          break;
        case type.SUBJECT:
          whenSubjects.push(whenDictionary[i][0]);
          break;
        case type.PREACTION:
          isGuard = true;
          break;
        case type.PRESUBJECT:
          break;
        case type.GUARD:
          isGuard = true;
          break;
        case type.OTHER:
          break;
      }
    }
    for (let i = 0; i < thenDictionary.length; i++) {
      switch (thenDictionary[i][1]) {
        case type.STATE:
          thenState = this.restObj(thenDictionary);
          break;
        case type.ACTION:
          break;
        case type.SUBJECT:
          thenSubjects.push(thenDictionary[i][0]);
          break;
        case type.OTHER:
          break;
        case type.PREACTION:
          isLocalAction = true;
          break;
        case type.OPERATIONS:
          isLocalAction = true;
          break;
        case type.PRESUBJECT:
          break;
      }
    }
    if (!isAction && !isGuard && !isLocalAction) {
      //supports only one state for now, could improve placings
      var v_1 = this.createVertex(givenState, this.vertices.length), v_2 = this.createVertex(thenState, this.vertices.length);
      var v_1c = this.checkVertex(v_1), v_2c = this.checkVertex(v_2);
      if (v_1.id === v_1c.id) {
        this.vertices.push(v_1);
        this.props.createElement(v_1);
        v_2.properties.x += 250;
      }
      else {
        v_1 = v_1c;
      }
      if (v_2 === v_2c) {
        this.vertices.push(v_2);
        this.props.createElement(v_2);
      }
      else {
        v_2 = v_2c;
      }
      var e_1 = this.createEdge(whenState, v_1.id, v_2.id);
      if (this.checkEdge(e_1.sourceVertexId, e_1.targetVertexId)) {
        this.edges.push(e_1);
        this.props.createElement(e_1);
      }
      document.getElementById("given-box").value = "";
      document.getElementById("when-box").value = "";
      document.getElementById("then-box").value = "";
    }
    if (isAction) {
      console.log("Actions: ");
      for (let i = 0; i < givenSubjects.length; i++) {
        if (!this.variables.includes(givenSubjects[i])) {
          action = givenSubjects[i];
          start = false;
          for (let j = 0; j < givenDictionary.length; j++) {
            if (givenDictionary[j][1] === type.PREACTION) {
              start = true;
            }
            if (start) {
              if (givenDictionary[j][1] === type.NUMBER || givenDictionary[j][1] === type.LOGIC) {
                action = action + "=" + givenDictionary[j][0] + ";";
                this.variables.push(givenSubjects[i]);
                this.createModelAction(action);
                document.getElementById("given-box").value = "";
              }
            }
            else {
              document.getElementById("error").innerHTML = "No applicable value for given";
            }
          }
        }
      }  
    }
    if (isGuard) {
      for (let i = 0; i < whenSubjects.length; i++) {
        if (!this.variables.includes(whenSubjects[i])) {
          action = whenSubjects[i];
          start = false;
          for (let j = 0; j < whenDictionary.length; j++) {
            if (whenDictionary[j][1] === type.NUMBER) {
              action = action + "=" + "0;";
              this.variables.push(whenSubjects[i]);
              this.createModelAction(action);
              break;
            }
            else if (whenDictionary[j][1] === type.LOGIC) {
              action = action + "=" + "true;";
              this.variables.push(whenSubjects[i]);
              this.createModelAction(action);
              break;
            }
          }
        }
        var guard = "", worth = "";
        for (let j = 0; j < whenDictionary.length; j++) {
          action = whenSubjects[i];
          if (whenDictionary[j][1] === type.GUARD) {
            if (whenDictionary[j][0] === "higher" || whenDictionary[j][0] === "above" || whenDictionary[j][0] === "more") {
              guard = ">";
            }
            else if (whenDictionary[j][0] === "lower" || whenDictionary[j][0] === "below" || whenDictionary[j][0] === "less") {
              guard = "<";
            }
            else {
              guard = whenDictionary[j][0];
            }            
          }
          else if (whenDictionary[j][1] === type.NUMBER || whenDictionary[j][1] === type.LOGIC) {
            worth = whenDictionary[j][0];
          }
        }
        console.log(guard + " and " +  worth);
        if (guard !== "" || worth !== "") {
          if (this.assignment.includes(guard) || guard === "is") {
            guard = "=";
          }
          action = action + guard + worth;
          console.log("Guard: " + action);
          this.createGuard(action);
          document.getElementById("when-box").value = "";
        }
        else {
          document.getElementById("error").innerHTML = "No applicable value for when";
        }
      }
    }
    if (isLocalAction) {
      for (let i = 0; i < thenSubjects.length; i++) {
        if (!this.variables.includes(thenSubjects[i])) {
          action = thenSubjects[i];
          start = false;
          for (let j = 0; j < thenDictionary.length; j++) {
            if (thenDictionary[j][1] === type.NUMBER) {
              action = action + "=" + "0;";
              this.variables.push(thenSubjects[i]);
              this.createModelAction(action);
              break;
            }
            else if (thenDictionary[j][1] === type.LOGIC) {
              action = action + "=" + "true;";
              this.variables.push(thenSubjects[i]);
              this.createModelAction(action);
              break;
            }
          }
        }
        var localAction = "";
        for (let j = 0; j < thenDictionary.length; j++) {
          action = thenSubjects[i];
          if (thenDictionary[j][1] === type.ACTION || thenDictionary[j][1] === type.OPERATIONS || thenDictionary[j][1] === type.PREACTION) {
            if (thenDictionary[j][0] === "adds") {
              localAction = "+=";
            }
            else if (thenDictionary[j][0] === "subtracts") {
              localAction = "-=";
            }
            else if (thenDictionary[j][0] === "multiplies") {
              localAction = "*=";
            }
            else if (thenDictionary[j][0] === "divides") {
              localAction = "/=";
            }
            else {
              if (thenDictionary[j][0] === "set" || thenDictionary[j][0] === "sets") {
                localAction = "=";
              }
              else {
                localAction = thenDictionary[j][0];
              }
            }
          }
          else if (thenDictionary[j][1] === type.NUMBER || thenDictionary[j][1] === type.LOGIC) {
            worth = thenDictionary[j][0];
          }
        }
        console.log(localAction + " and " + worth);
        if (localAction !== "" || worth !== "") {
          action = action + localAction + worth;
          console.log("local: " + action);
          this.createLocalAction(action);
          document.getElementById("then-box").value = "";
        }
        else {
          document.getElementById("error").innerHTML = "No applicable value for then";
        }
      }
    }
  }

  updateTrigger = () => {
    this.modelUpdater(document.getElementById("given-box").value, document.getElementById("when-box").value, document.getElementById("then-box").value);
  }

  loadElement = (name) => {
    console.log(this.vertices);
    console.log(this.edges);
    for (let i = 0; i < this.vertices.length; i++) {
      if (this.vertices[i].name.includes(name)) {
        this.props.selectElement(this.vertices[i].id);
        console.log("should select");
      }
    }
    for (let i = 0; i < this.edges.length; i++) {
      if (this.edges[i].name.includes(name)) {
        this.props.selectElement(this.edges[i].id);
      }
    }
  }

  loadFromJSON = () => {//get from json and choose element based on name

    const file = document.getElementById("json-upload").files[0];
    var fr = new FileReader();
    var self = this;
    fr.onload = function (e) {
      console.log(e);
      var result = JSON.parse(e.target.result);
      for (let i in result.requirements)
      {
        var start = new Date();
        var req = result.requirements[i];
        console.log(req);
        var given = req.given;
        var when = req.when;
        var then = req.then;
        var name = req.name;
        if (name !== "") {
          self.loadElement(name);
          console.log(name);
        }
        self.modelUpdater(given, when, then);
      }
      var end = new Date();
      var seconds = ((end - start));
      console.log(seconds);
    }
    fr.readAsText(file);

    
  }

  render() {
    return (
      <Group name="Text" isOpen={true}>
        <p id="error"></p>
        <FormGroup label="Given">
          <InputGroup id="given-box" />
        </FormGroup>
        <FormGroup label="When">
          <InputGroup id="when-box" />
        </FormGroup>
        <FormGroup label="Then">
          <InputGroup id="then-box" />
        </FormGroup>
        <Button onClick={this.updateTrigger}>Add Element</Button>
        <label>
          <input id="json-upload" type="file" onChange={this.loadFromJSON} />
        </label>
      </Group>
      )
  }
}

const mapStateToProps = ({ test }) => {
  return {
    test
  }
}

export default connect(mapStateToProps, { updateModel, addModel, createElement, updateElement, updateAddModel, selectElement })(TextGroup);
