#!/bin/bash
MAP=$1
OUTPUT_DIR=$2

echo "MAP: $MAP"
echo "OUTPUT_DIR: $OUTPUT_DIR"

if [ -d "/screenshots" ]; then
  echo "/screenshots exists"
  ls -la /screenshots
else
  echo "/screenshots doesnt exist"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
if [ ! -d "$OUTPUT_DIR" ]; then
  echo "failed 2 create $OUTPUT_DIR"
  exit 1
else
  echo "created $OUTPUT_DIR"
  chmod 777 "$OUTPUT_DIR"
fi

function send_cmd() {
  echo "Sending command: $1"
  echo "$1" > /css/cstrike/cfg/exec.cfg
  DISPLAY=:0 xdotool key F1
  sleep 1
}

echo "Starting CSS"
send_cmd "map $MAP"
sleep 11

DISPLAY=:0 xdotool key Return
sleep 0.4
DISPLAY=:0 xdotool key Return
sleep 0.4
DISPLAY=:0 xdotool key Return
sleep 0.4
DISPLAY=:0 xdotool key Return

echo "Generating screenshots"
for i in {1..5}; do
  echo "Generating screenshot $i"
  send_cmd "script_execute random_pos"
  sleep 1
  DISPLAY=:0 scrot -o "$OUTPUT_DIR/clue_$i.jpg"
  sleep 1
done

echo "done ^^"