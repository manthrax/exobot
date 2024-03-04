DROK DC Buck Converter x2
https://www.amazon.com/DROK-Numerical-Switching-Adjustable-Stabilizers/dp/B00BYTEHQO/ref=pd_bxgy_23_img_2?ie=UTF8&psc=1&refRID=QJJMT22ZZ7SP7H3W6H8K

8*2 = 16$

Adafruit 16-Channel PWM / Servo HAT for Raspberry Pi - Mini Kit

https://www.amazon.com/Adafruit-16-Channel-PWM-Servo-Raspberry/dp/B00SI1SPHS/ref=sr_1_1?s=aht&ie=UTF8&qid=1478479106&sr=8-1&keywords=pwm+servo+hat

20$ bucks.

Raspberry Pi 3 Model B Motherboard
https://www.amazon.com/Raspberry-Pi-RASP-PI-3-Model-Motherboard/dp/B01CD5VC92/ref=sr_1_1?ie=UTF8&qid=1478479138&sr=8-1&keywords=raspi+3
37$


TowerPro SG90 9G Micro Servo 10pk For RC Airplane Boat Helicopter Robot Controls
https://www.amazon.com/TowerPro-Micro-Airplane-Helicopter-Controls/dp/B01D6FEI1W/ref=sr_1_2?ie=UTF8&qid=1478479177&sr=8-2&keywords=servo+10+pack

22$


16+20+37+22 = 95$







sudo apt-get update
sudo apt-get install node
sudo npm install http
sudo npm install express
sudo npm install ws
sudo npm install adafruit-pca9685

sudo nano /etc/rc.local

Add this before the "exit 0" line.. this makes the bot code launch at startup.

su pi -c '~/bot/exobot/nodebot.sh < /dev/null &'


![image](https://github.com/manthrax/exobot/assets/350247/be4da3d7-04bc-418a-ba7c-898107a311dd)
