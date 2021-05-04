#!/bin/bash

root=`dirname $0`
export GODEBUG="http2server=0"

"${root}/server" > "${root}/../var/log/synos.log" 2>&1 &
disown
