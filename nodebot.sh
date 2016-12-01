#!/bin/bash
#while true
#do
cd ~/bot/exobot/
sudo git pull
sudo node index.js
if [ $? -ne 0 ] 
then
	exit -1
fi
#	echo $?
#done
