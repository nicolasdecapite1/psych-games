import React, { useEffect, useState } from "react";
import "../util/common_stylings/FullScreenDiv.css";
import PlayerColumn from "./components/PlayerColumn";
import { Grid, withStyles } from "@material-ui/core";
import socket from "../socketClient";
import ConfirmButton from "./components/ConfirmButton";
import { withRouter } from "react-router-dom";
import GroupBox from "./components/GroupBox";
import GameTimer from "../util/common_components/GameTimer";
import getAlerts from './components/getAlerts';

const FULL_DIV = "fullDiv";
const SUMMARY_ROUTE = "/summary";
const MAX_HEIGHT = 100;
const BOTTOM_OF_SCREEN = 100;
const INITIAL_HEIGHT = 0;
const NUM_PLAYERS = 6;
const VERTICAL_CONSTANT = 1;
const VERTICAL_SCALAR = 0.58;
const NEGATIVE_ONE = -1;
const MAX_PLAYERS_SELECTED = 2;
const PLAYERS = [0, 1, 2, 3, 4, 5];
const NOT_SELECTED = false;
const NOT_SELECTED_INT = 0;
const SELECTED_INT = 1;
const DONT_SUBMIT_DECISIONS = false;
const SELECTED_SELF = true;
const DID_NOT_SELECT_SELF = false;
const TOO_MANY_SELECTIONS = true;
const NOT_TOO_MANY_SELECTS = false;
const RESET_TIMER = true;
const DO_NOT_RESET_TIMER = false;
const FIRST_CODE = 0;
const SECOND_CODE = 1;
const THIRD_CODE = 2;
const PAUSE_BETWEEN_ANIMATIONS = 2000;
const IN_BONUS = true;
const NORMAL_ANIMATION_OFFSET = 1;

const GROUP_ONE = "One";
const GROUP_TWO = "Two";
const GRID_DIRECTION = "row";
const GRID_JUSTIFICATION = "center";
const GROUP_BOX_WIDTH = "60vw";
const ANIMATED_COLUMNS_HEIGHT = "80vh";

const END_TURN_WEBSOCKET = "location for game 1";
const END_GAME_WEBSOCKET = "end game 1";

const styles = {
  animatedColumns: {
    position: "absolute",
    top: "8vh",
    left: "19vw",
    height: "90vh",
    width: "85vw",
    borderRadius: "20px",
    alignItems: "center",
    verticalAlign: "middle",
  },
  groupTwoBox: {
    position: "absolute",
    top: "77vh",
    left: '13vw'
  }
};

/**
 * All-encompassing class used to run the first game of the psych experiment.
 * Leverages components in the subpackage game_one.components to create a game following the rules outlined in the GameOneTutorial.png file.
 * @param {*} props is used to prove the login code of the player and all login codes for all players.
 * 
 * @author Eric Doppelt
 */
function GameOne(props) {
  const [startHeights, setStartHeights] = useState(createPlayerArray(BOTTOM_OF_SCREEN));

  let initialHeights = createPlayerArray(scaleHeight(INITIAL_HEIGHT));

  const [endHeights, setEndHeights] = useState(initialHeights);
  const [currentHeight, setCurrentHeight] = useState(initialHeights);

  let initialSelections = createPlayerArray(NOT_SELECTED);
  const [selected, setSelected] = useState(initialSelections);
  const [doubles, setDoubles] = useState(initialSelections);
  const [triples, setTriples] = useState(initialSelections);

  const [selectedSelf, setSelectedSelf] = useState(DID_NOT_SELECT_SELF);
  const [tooManySelects, setTooManySelects] = useState(NOT_TOO_MANY_SELECTS);

  const [resetTimer, setResetTimer] = useState(DO_NOT_RESET_TIMER);
  const [submitDecisions, setSubmitDecisions] = useState(DONT_SUBMIT_DECISIONS);

  useEffect(() => {
    socket.on(END_TURN_WEBSOCKET, (locations, tripleBonuses, tripleIncrease, doubleBonuses, doubleIncrease) => {
        handleTripleBonuses(
          tripleBonuses,
          tripleIncrease,
          props.allLoginCodes,
          setStartHeights,
          setEndHeights,
          currentHeight,
          setCurrentHeight,
          setTriples
        );
      
        let tripleBonusPause = tripleBonuses.length * PAUSE_BETWEEN_ANIMATIONS;
        clearBonusArray(setTriples, tripleBonusPause);

        handleDoubleBonuses(
          doubleBonuses,
          doubleIncrease,
          props.allLoginCodes,
          setStartHeights,
          setEndHeights,
          currentHeight,
          setCurrentHeight,
          setDoubles,
          tripleBonuses.length
        );

        let allBonusPause = (tripleBonuses.length + doubleBonuses.length) * PAUSE_BETWEEN_ANIMATIONS;
        clearBonusArray(setDoubles, allBonusPause);

        updateHeightsDelayed(
          currentHeight,
          scaleHeights(locations),
          setStartHeights,
          setEndHeights,
          setCurrentHeight,
          (tripleBonuses.length + doubleBonuses.length) *
            PAUSE_BETWEEN_ANIMATIONS
        );
        setResetTimer(RESET_TIMER);
      }
    );

    socket.on(END_GAME_WEBSOCKET, (winners, losers, doubleBonuses, tripleBonuses) => {
      props.setWinners(winners);
      props.setLosers(losers);
      let finalPause = (doubleBonuses + tripleBonuses + NORMAL_ANIMATION_OFFSET) * PAUSE_BETWEEN_ANIMATIONS
      setTimeout(
        () => moveToSummary(props), finalPause);
    });

    return () => {
      socket.off(END_TURN_WEBSOCKET);
      socket.off(END_GAME_WEBSOCKET);
    };
  }, [currentHeight, props]);

  const { classes } = props;

  return (
    <div className={FULL_DIV}>
      {getAlerts(
        selectedSelf,
        setSelectedSelf,
        tooManySelects,
        setTooManySelects
      )}

      <GameTimer
        setSubmitDecisions={setSubmitDecisions}
        resetTimer={resetTimer}
        setResetTimer={setResetTimer}
      />
      <ConfirmButton
        submit={submitDecisions}
        clearSubmission={() => setSubmitDecisions(DONT_SUBMIT_DECISIONS)}
        selected={selected}
        clearSelected={() => clearSelected(setSelected)}
        loginCode={props.loginCode}
        allLoginCodes={props.allLoginCodes}
      />

      <div className={classes.animatedColumns}>
        <GroupBox groupNumber={GROUP_ONE} width={GROUP_BOX_WIDTH} />
        <Grid
          container
          direction={GRID_DIRECTION}
          justify={GRID_JUSTIFICATION}
          spacing={10}
          style={{ height: {ANIMATED_COLUMNS_HEIGHT} }}
        >
          {PLAYERS.map((player) => {
            return getColumn(
              player,
              selected,
              setSelected,
              setSelectedSelf,
              setTooManySelects,
              startHeights,
              endHeights,
              props.allLoginCodes,
              props.loginCode,
              doubles,
              triples
            );
          })}
        </Grid>
        <div className={classes.groupTwoBox}>
          <GroupBox groupNumber={GROUP_TWO} width={GROUP_BOX_WIDTH} />
        </div>
      </div>
    </div>
  );
}


function getColumn(playerNumber, selected, setSelected, setSelectedSelf, setTooManySelections, fromHeights, toHeights, playerIDs, myID, doubles, triples) {
  return (
    <Grid item>
      <PlayerColumn
        onSelect={() =>
          selectPlayer(
            playerNumber,
            selected,
            setSelected,
            setSelectedSelf,
            setTooManySelections,
            playerIDs,
            myID
          )
        }
        selected={selected[playerNumber]}
        double={doubles[playerNumber]}
        triple={triples[playerNumber]}
        from={fromHeights[playerNumber]}
        to={toHeights[playerNumber]}
        player={playerNumber}
      />
    </Grid>
  );
}

function handleTripleBonuses(tripleArray, tripleIncrease, allLoginCodes, setOldHeights, setNewHeights, originalHeights, setCurrentHeight, setTriples) {
  let oldHeights = originalHeights.slice(0);
  for (let i = 0; i < tripleArray.length; i++) {
    let loginCodes = tripleArray[i];
    let newHeights = oldHeights.slice(0);
    let firstIndex = getPlayerIndex(loginCodes[FIRST_CODE], allLoginCodes);
    let secondIndex = getPlayerIndex(loginCodes[SECOND_CODE], allLoginCodes);
    let thirdIndex = getPlayerIndex(loginCodes[THIRD_CODE], allLoginCodes);
    let scaledBonus = scaleBonus(tripleIncrease);
    newHeights[firstIndex] += scaledBonus;
    newHeights[secondIndex] += scaledBonus;
    newHeights[thirdIndex] += scaledBonus;
    updateHeightsDelayed(oldHeights, newHeights, setOldHeights, setNewHeights, setCurrentHeight, i * PAUSE_BETWEEN_ANIMATIONS);
    markTripleDelayed(firstIndex, secondIndex, thirdIndex, setTriples, i * PAUSE_BETWEEN_ANIMATIONS);
    oldHeights = newHeights;
  }
}

function markTripleDelayed(firstIndex, secondIndex, thirdIndex, setTriples, delay) {
  updateBonusArray([firstIndex, secondIndex, thirdIndex], setTriples, delay);
}

function handleDoubleBonuses(doubleArray, doubleIncrease, allLoginCodes, setOldHeights, setNewHeights, originalHeights, setCurrentHeight, setDoubles, animationOffset) {
  let oldHeights = originalHeights.slice(0);
  for (let i = 0; i < doubleArray.length; i++) {
    let loginCodes = doubleArray[i];
    let newHeights = oldHeights.slice(0);
    let firstIndex = getPlayerIndex(loginCodes[FIRST_CODE], allLoginCodes);
    let secondIndex = getPlayerIndex(loginCodes[SECOND_CODE], allLoginCodes);
    let scaledBonus = scaleBonus(doubleIncrease);
    newHeights[firstIndex] += scaledBonus;
    newHeights[secondIndex] += scaledBonus;
    updateHeightsDelayed(oldHeights,newHeights, setOldHeights, setNewHeights, setCurrentHeight, (i + animationOffset) * PAUSE_BETWEEN_ANIMATIONS);
    markDoubleDelayed(firstIndex, secondIndex, setDoubles, (i + animationOffset) * PAUSE_BETWEEN_ANIMATIONS);
    oldHeights = newHeights;
  }
}

function markDoubleDelayed(firstIndex, secondIndex, setDoubles, delay) {
  updateBonusArray([firstIndex, secondIndex], setDoubles, delay);
}

function updateHeightsDelayed(oldHeights, newHeights, setOldHeights, setNewHeights, setCurrentHeight, delay) {
  setCurrentHeight(newHeights);
  setTimeout(() => updateHeights(oldHeights, newHeights, setOldHeights, setNewHeights), delay);
}

function updateHeights(oldHeights, newHeights, setOldHeights, setNewHeights) {
  setOldHeights(oldHeights);
  setNewHeights(newHeights);
}

function clearBonusArray(setBonus, delay) {
  setTimeout(() => setBonus(createPlayerArray(NOT_SELECTED)), delay);
}

function updateBonusArray(indexArray, setBonus, delay) {
  let bonusArray = createPlayerArray(NOT_SELECTED);
  indexArray.forEach((index) => {
    bonusArray[index] = IN_BONUS;
  });
  setTimeout(() => setBonus(bonusArray), delay);
}

function clearSelected(setSelected) {
  setSelected(createPlayerArray(NOT_SELECTED));
}

function scaleBonus(bonus) {
  return NEGATIVE_ONE * VERTICAL_SCALAR * bonus;
}

function scaleHeight(height) {
  let invertedHeight = invertHeight(height);
  return invertedHeight * VERTICAL_SCALAR + VERTICAL_CONSTANT;
}

function scaleHeights(heightArray) {
  return heightArray.map((height) => scaleHeight(height));
}

function createPlayerArray(height) {
  let heights = new Array(NUM_PLAYERS);
  heights.fill(height);
  return heights;
}

function selectPlayer(player, selected, setSelected, setSelectedSelf, setTooManySelections, playerIDs, myID) {
  if (playerIDs[player] === myID) {
    setSelectedSelf(SELECTED_SELF);
    return;
  }

  let playerIsSelected = NOT_SELECTED_INT;
  if (selected[player]) playerIsSelected = SELECTED_INT;

  if (
    countSelectedPlayers(selected) <
    MAX_PLAYERS_SELECTED + playerIsSelected
  ) {
    let updatedSelection = selected.slice(0);
    updatedSelection[player] = !updatedSelection[player];
    setSelected(updatedSelection);
  } else {
    setTooManySelections(TOO_MANY_SELECTIONS);
  }
}

function countSelectedPlayers(selected) {
  return getSelectedPlayers(selected).length;
}

function getSelectedPlayers(selected) {
  let selectedPlayers = [];
  for (let i = 0; i < NUM_PLAYERS; i++) {
    if (selected[i]) selectedPlayers.push(selected[i]);
  }
  return selectedPlayers;
}

function invertHeight(height) {
  return MAX_HEIGHT - height;
}

function getPlayerIndex(loginCode, allLoginCodes) {
  for (let i = 0; i < allLoginCodes.length; i++) {
    if (allLoginCodes[i] === loginCode) return i;
  }
}

function moveToSummary(props) {
  props.history.push(SUMMARY_ROUTE);
}

export default withRouter(withStyles(styles)(GameOne));
