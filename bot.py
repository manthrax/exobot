from __future__ import divisionimport timeimport Adafruit_PCA9685import cursesimport json# Uncomment to enable debug output.#import logging#logging.basicConfig(level=logging.DEBUG)# Initialise the PCA9685 using the default address (0x40).pwm = Adafruit_PCA9685.PCA9685()# Alternatively specify a different address and/or bus:#pwm = Adafruit_PCA9685.PCA9685(address=0x41, busnum=2)state = []try:    with open('botstate.json') as json_data:        state = json.load(json_data)    print(state)except Error:    state = []nservos = 8# Configure min and max servo pulse lengthsservo_min = 150  # Min pulse length out of 4096servo_max = 600  # Max pulse length out of 4096servo_mid = int((servo_min+servo_max)/2)servo_rng = servo_max-servo_min;stdscr = curses.initscr()curses.cbreak()stdscr.keypad(1)stdscr.addstr(0,10,"Hit 'q' to quit")stdscr.refresh()key = ''# Helper function to make setting a servo pulse width simpler.def set_servo_pulse(channel, pulse):    pulse_length = 1000000    # 1,000,000 us per second    pulse_length //= 60       # 60 Hz    print('{0}us per period'.format(pulse_length))    pulse_length //= 4096     # 12 bits of resolution    print('{0}us per bit'.format(pulse_length))    pulse *= 1000    pulse //= pulse_length    pwm.set_pwm(channel, 0, pulse)sv = []ss = 0;def svset(idx,pos):    global ss;    ss = idx;    sv[ss]=pos;    svpwm = int(((sv[ss]*servo_rng)/2)+servo_mid)    pwm.set_pwm(ss,0,svpwm)    def disableServo(idx):    pwm.set_pwm(idx,0,0)def disableServos():    for x in range(0,nservos):        disableServo(x);def resetServos():    # Set frequency to 60hz, good for servos.    pwm.set_pwm_freq(60)    for x in range(0,nservos):            stdscr.addstr(15,0,'Moving servo on channel '+str(x)+'         ')        stdscr.refresh()        pwm.set_pwm(x,0,servo_mid)        time.sleep(0.25)        disableServo(x)        sv.append(0.0)    #while True:        # Move servo on channel O between extremes.        #set_servo_pulse(0, servo_mid)        #k = raw_input("?")        #print(k)        #time.sleep(1)        #set_servo_pulse(1, servo_mid)def svo(off):    sv[ss]+=off    if(sv[ss]<-1.0): sv[ss]=-1.0    elif (sv[ss]>1.0): sv[ss]=1.0    svpwm = int(((sv[ss]*servo_rng)/2)+servo_mid)    pwm.set_pwm(ss,0,svpwm)    stdscr.addstr(6,5,str(sv[ss])+"   "+str(svpwm)+"       ");        def svi(off):    global ss    ss += off    if(ss<0): ss=0    elif (ss>=len(sv)): ss=len(sv)-1    stdscr.addstr(1,5,str(ss)+"   ");resetServos()while key != ord('q'):    key = stdscr.getch()    #stdscr.addch(20,25,key)    stdscr.refresh()    if key == curses.KEY_UP:        stdscr.addstr(2, 20, "Up")        svo(0.1)    elif key == curses.KEY_DOWN:        stdscr.addstr(4, 20, "Down")        svo(-0.1)    elif key == curses.KEY_LEFT:        stdscr.addstr(3, 15, "Left")        svi(-1)    elif key == curses.KEY_RIGHT:        stdscr.addstr(3, 25, "Right")        svi(1)    elif key == ord('r'):        resetServos();    elif key == ord('k'):        for x in range(0,8):            svset(x,0.5)            time.sleep(0.15)        for x in range(0,8):            svset(x,-0.5)            time.sleep(0.15)    elif key == ord('x'):        disableServos();curses.endwin()