import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import { me as appbit } from "appbit";
import { today, goals } from "user-activity";
import * as messaging from "messaging";
import * as util from "../common/utils";

// Update the clock every minute
clock.granularity = "minutes";

// The labels for all the displayed data
const timeLabel = document.getElementById("time-label");
const stepsLabel = document.getElementById("steps-label");
const dateLabel = document.getElementById("date-label");
const tempLabel = document.getElementById("temp-label");

// The svg object for the step progress circle
const stepsCircle = document.getElementById("steps-circle");

var getDateTime = evnt => evnt.date;

var getSteps = () =>
  appbit.permissions.granted("access_activity")
    ? today.adjusted.steps
    : 0;

var getStepGoal = () =>
  appbit.permissions.granted("access_activity")
    ? goals.steps
    : 0;

var updateTime = now => {
  let hours = now.getHours();
  hours = preferences.clockDisplay === "12h" ? hours % 12 || 12 : util.zeroPad(hours);

  let mins = util.zeroPad(now.getMinutes());

  timeLabel.text = `${hours}:${mins}`;
}

var updateStepCircle = () => {
  let steps = getSteps();
  let goal = getStepGoal();

  stepsCircle.sweepAngle = stepGoalAngle(steps, goal);
}

var updateDate = now => {
  let month = util.months[now.getMonth()];
  let day = util.days[now.getDay()];
  let date = now.getDate();

  dateLabel.text = `${day} ${month} ${date}`;
}

var updateSteps = () => {
  let steps = getSteps();
  steps = steps.toLocaleString('en-US');

  stepsLabel.text = `${steps} Steps`;
}

var stepGoalAngle = (count, goal) =>
  goal > count
    ? 360 * count / goal
    : 360;

var updateTemp = temp => {
  tempLabel.text = `${temp}°F`;
}

// Request weather data from the companion
var fetchWeather = () => {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: 'weather'
    });
  }
}

// Display the weather data received from the companion
var processWeatherData = data => {
  updateTemp(data.temperature);
}

// Listen for the onopen event
messaging.peerSocket.onopen = () => {
  // Fetch weather when the connection opens
  fetchWeather();
}

// Listen for messages from the companion
messaging.peerSocket.onmessage = evnt => {
  if (evnt.data) {
    processWeatherData(evnt.data);
  }
}

// Listen for the onerror event
messaging.peerSocket.onerror = err => {
  // Handle any errors
  console.log("Connection error: " + err.code + " - " + err.message);
}

// The main tick event loop!
clock.ontick = evnt => {
  let now = getDateTime(evnt);

  updateTime(now);
  updateDate(now);
  
  updateSteps();
  updateStepCircle();
}

// Fetch the weather every 30 minutes
setInterval(fetchWeather, 30 * 1000 * 60);