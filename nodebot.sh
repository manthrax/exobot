#!/bin/bash
while true
do
	cd ~/bot/exobot/
	sudo git pull
	sudo node index.js
	if [ $? -ne 0 ] 
	then
		echo "FailWagon"
		exit -1
	fi
done
