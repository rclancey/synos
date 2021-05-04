#!/bin/sh

root=`dirname $0`
pid=`cat "${root}/../var/synos.pid"`
kill $pid
