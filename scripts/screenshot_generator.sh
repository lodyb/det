#!/bin/bash
MAP=$1
OUTPUT_DIR=$2

mkdir -p "$OUTPUT_DIR"

echo "MAP: $MAP"

function send_cmd() {
  # todo: make it so i can bypass the motd and team select
  DISPLAY=:0 xdotool key Return
  sleep 0.4
  DISPLAY=:0 xdotool key Return
  sleep 0.4
  DISPLAY=:0 xdotool key Return
  sleep 0.4
  DISPLAY=:0 xdotool key Return
  sleep 0.4
  echo "Sending command: $1"
  echo "$1" > /css/cstrike/cfg/exec.cfg
  DISPLAY=:0 xdotool key F1
  sleep 1
}

echo "Starting CSS"
send_cmd "map $MAP"
sleep 9


DISPLAY=:0 xdotool key Return
sleep 0.4
DISPLAY=:0 xdotool key Return
sleep 0.4
DISPLAY=:0 xdotool key Return



echo "Generating screenshots"
for i in {1..5}; do
  echo "Generating screenshot $i"
  send_cmd "script_execute vscript/random_pos"
  sleep 1
  DISPLAY=:0 scrot -o "$OUTPUT_DIR/$i.jpg" # todo: can i use jpeg ingame command
  sleep 1
done

echo "done ^^"