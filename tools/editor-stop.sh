#!/bin/sh
# Stop the editor, on any of the three platforms, and leave nothing behind.
#
# Why a script rather than a Makefile line: the three platforms disagree about
# every step of it — how you find a process by port (`ss` / `lsof` / `netstat`),
# how you read its command line (`/proc` / `ps` / `wmic`), and how you kill it
# (`kill` / `taskkill`). A recipe that tries to be all three in shell quoting is
# how the previous one came to work on Linux alone.
#
# TWO WAYS IN, and both are needed:
#
#   1. the PID FILE, which covers a server started by `make play` / `play-fast`;
#   2. the PORT, which covers every other way one gets started — by a gate loop,
#      by hand, by a run that was interrupted before it wrote the file. Most of the
#      servers left running on this box this week were started that way.
#
# ⚠ IT KILLS ONLY WHAT IT CAN IDENTIFY AS THIS EDITOR. The box is shared with other
# agents, and `pkill -f editor_server.loft` matches the shell running it as well as
# the server — it has taken out a session here once already. Worse, a NATIVE build
# is `loft_native_bin_<n>` and carries no source name at all, so "kill anything
# called loft_native_bin" would kill a sibling's compiler run. Checked twice today:
# the leftover on port 18090 was ours, the one in ~/.cache/tmp was loft's own, and
# only the first was stopped.
#
# Exit status is 0 whether or not anything was running: "already stopped" is a
# success, and a stop command that fails when there is nothing to stop cannot be
# put at the end of a gate run.
set -u

PORT="${EDITOR_PORT:-18090}"
PIDFILE="${EDITOR_PID:-.editor.pid}"

case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*|Windows_NT) PLATFORM=windows ;;
  Darwin)                          PLATFORM=mac ;;
  *)                               PLATFORM=linux ;;
esac

# The command line of a pid, or empty — the one thing all three spell differently.
cmdline_of() {
  case "$PLATFORM" in
    linux)   tr '\0' ' ' < "/proc/$1/cmdline" 2>/dev/null ;;
    mac)     ps -o command= -p "$1" 2>/dev/null ;;
    windows) wmic process where "ProcessId=$1" get CommandLine 2>/dev/null | tail -n +2 ;;
  esac
}

# Whoever is listening on the port, or empty.
pid_on_port() {
  case "$PLATFORM" in
    linux)   ss -lptn "sport = :$PORT" 2>/dev/null | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2 ;;
    mac)     lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | head -1 ;;
    windows) netstat -ano 2>/dev/null | grep -E "[:.]$PORT[[:space:]]+.*LISTEN" | awk '{print $NF}' | head -1 ;;
  esac
}

is_editor() {
  cmd=$(cmdline_of "$1")
  case "$cmd" in
    *editor_server.loft*|*loft_native_bin_*) return 0 ;;
    *) return 1 ;;
  esac
}

stop_pid() {
  case "$PLATFORM" in
    windows) taskkill //PID "$1" //F >/dev/null 2>&1 ;;
    *)       kill "$1" 2>/dev/null ;;
  esac
}

still_alive() {
  case "$PLATFORM" in
    windows) tasklist //FI "PID eq $1" 2>/dev/null | grep -q "$1" ;;
    *)       kill -0 "$1" 2>/dev/null ;;
  esac
}

stopped=0

# 1 — the pid file
if [ -f "$PIDFILE" ]; then
  filepid=$(cat "$PIDFILE" 2>/dev/null)
  if [ -n "${filepid:-}" ] && still_alive "$filepid"; then
    if is_editor "$filepid"; then
      stop_pid "$filepid"; stopped=1
      echo "editor: stopped pid $filepid (pid file)"
    else
      echo "editor: pid $filepid in $PIDFILE is not this editor — left alone"
    fi
  fi
  rm -f "$PIDFILE"
fi

# 2 — the port, for every server the file never knew about
portpid=$(pid_on_port)
if [ -n "${portpid:-}" ]; then
  if is_editor "$portpid"; then
    stop_pid "$portpid"; stopped=1
    echo "editor: stopped pid $portpid (listening on $PORT)"
  else
    echo "editor: port $PORT is held by pid $portpid, which is NOT this editor — left alone"
  fi
fi

# Give it a moment to release the port, then say plainly whether it is free. A stop
# that returns before the socket is gone is why the next start died on "address
# already in use" and looked like a different bug.
if [ "$stopped" = 1 ]; then
  n=0
  while [ "$n" -lt 20 ]; do
    [ -z "$(pid_on_port)" ] && break
    sleep 0.2 2>/dev/null || sleep 1
    n=$((n + 1))
  done
fi

if [ -z "$(pid_on_port)" ]; then
  [ "$stopped" = 1 ] || echo "editor: nothing running on $PORT"
  echo "editor: port $PORT is free"
  exit 0
fi
echo "editor: port $PORT is still held — see above"
exit 0
