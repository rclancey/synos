#!/bin/sh

w="$1"
h="$2"

pngtopam apple-launch-2048x2732.png | pamscale -width=$w > splash-${w}.pnm
pngtopam splashbg.png | pamcut -left 0 -top 0 -width ${w} -height ${h} > splashbg-${w}x${h}.pnm
pamcomp -align=center -valign=middle splash-${w}.pnm splashbg-${w}x${h}.pnm | pamtopng > apple-launch-${w}x${h}.png
rm splash-${w}.pnm splashbg-${w}x${h}.pnm
