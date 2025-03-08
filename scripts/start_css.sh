#!/bin/bash
# Force OpenGL rendering
export LIBGL_ALWAYS_SOFTWARE=1
export SDL_VIDEODRIVER=x11
export DXVK_HUD=0
export DXVK_STATE_CACHE=0
export DXVK_CONFIG_PATH=/dev/null
export PROTON_USE_WINED3D=1
export STEAM_RUNTIME=0

export DISPLAY=:0
export XDG_RUNTIME_DIR=/tmp/runtime-dir
export LD_LIBRARY_PATH=/usr/lib:/usr/lib32:/lib:/lib32

sleep 1

cd /css
./cstrike.sh -nojoy -novid -noipx -sw -gl -w 1280 -h 720 -novid +exec autoexec

GAME_PID=$!