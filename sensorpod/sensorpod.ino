/*
  
  Emic 2 Text-to-Speech Module: Basic Demonstration       
                                                         
  Author: Joe Grand [www.grandideastudio.com]             
  Contact: support@parallax.com                            
  
  Program Description:
  
  This program provides a simple demonstration of the Emic 2 Text-to-Speech
  Module. Please refer to the product manual for full details of system 
  functionality and capabilities.

  Revisions:
  
  1.0 (February 13, 2012): Initial release
  
*/

// include the SoftwareSerial library so we can use it to talk to the Emic 2 module
#include <SoftwareSerial.h>
#include <Wire.h>

#define rxPin 8    // Serial input (connects to Emic 2 SOUT)
#define txPin 9    // Serial output (connects to Emic 2 SIN)
#define ledPin 13  // Most Arduino boards have an on-board LED on this pin

const int sigSonar = 2;
long lastPing = 0;

long duration;
int lastCM = 0;

int debugLevel = 0;
const byte i2cSlaveId = 8;

// set up a new serial port
SoftwareSerial emicSerial =  SoftwareSerial(rxPin, txPin);

void speak(const char* str){  
  emicSerial.print('S');
  emicSerial.print(str);
  emicSerial.print('\n');
  while (emicSerial.read() != ':'); // Wait here until the Emic 2 responds with a ":" indicating it's ready to accept the next command
}

volatile int gotData = 0;
volatile int gotCount = 0;
volatile int gotRequest = 0;
volatile int curCommand = 0;
void requestCallback(){
  if(curCommand==0){
    for(int i=0;i<4;i++)Wire.write(((char*)&duration)[i]);
  }
  gotRequest=1;
}

char byteBuf[256];

void receiveCallback(int count){
  int i=0;
  gotCount = count;
  while (Wire.available()>0){byteBuf[i]= (char)Wire.read();i=(i+1)&255;} // receive byte as a character
  byteBuf[i]=0;
  gotData = i;
}

void setup()  // Set up code called once on start-up
{

  Wire.begin(i2cSlaveId);
  
  Wire.onReceive(receiveCallback);
  Wire.onRequest(requestCallback);
  
  // define pin modes
  pinMode(ledPin, OUTPUT);
  pinMode(rxPin, INPUT);
  pinMode(txPin, OUTPUT);
  
  // set the data rate for the SoftwareSerial port
  emicSerial.begin(9600);

  digitalWrite(ledPin, LOW);  // turn LED off
  
  /*
    When the Emic 2 powers on, it takes about 3 seconds for it to successfully
    intialize. It then sends a ":" character to indicate it's ready to accept
    commands. If the Emic 2 is already initialized, a CR will also cause it
    to send a ":"
  */
  emicSerial.print('\n');             // Send a CR in case the system is already up
  while (emicSerial.read() != ':');   // When the Emic 2 has initialized and is ready, it will send a single ':' character, so wait here until we receive it
  delay(10);                          // Short delay
  emicSerial.flush();                 // Flush the receive buffer
}


void loop()  // Main code, to run repeatedly
{
  // Speak some text
  digitalWrite(ledPin, HIGH);         // Turn on LED while Emic is outputting audio
  speak("My name is legion. For we are many.");
  digitalWrite(ledPin, LOW);
 
  delay(500);    // 1/2 second delay
    
  // Sing a song
  emicSerial.print("D2\n");
  digitalWrite(ledPin, HIGH);         // Turn on LED while Emic is outputting audio
  while (emicSerial.read() != ':'){
    delay(100);   // Wait here until the Emic 2 responds with a ":" indicating it's ready to accept the next command
  }
  digitalWrite(ledPin, LOW);

  speak("System ready.");
  int   blinkToggle=0;
  while(1)      // Demonstration complete!
  {
    if(blinkToggle==0){
      
      digitalWrite(ledPin, HIGH);
    }else if(blinkToggle==128){
      digitalWrite(ledPin, LOW);
    }
    blinkToggle=(blinkToggle+1)&255;

    if(gotData>0){
        int cmd = byteBuf[0];
        curCommand = cmd;
        if(cmd==123){
          String str = (const char*)(&byteBuf[1]);
          speak(str.c_str());
        }else if(cmd==0){
          pingSonar();
        }else if(cmd==126){
          debugLevel = 1;
          speak("debug 1");
        }else if(cmd==127){
          debugLevel = 0;
          speak("debug 0");
        }
        
        if(debugLevel){
          String str;
          str = "Got receive : ";
          str += gotData;
          speak(str.c_str());
  
          str = "Data count is: ";
          str += gotCount;
          speak(str.c_str());
          
          str = "First byte is: ";
          str += (int)(byteBuf[0]);
          speak(str.c_str());
        }
        gotData = 0;
    }

    if(gotRequest>0){
      if(debugLevel){
        speak("Got Request.");
      }
      gotRequest = 0;
    }
    delay(1);
  }
}

void pingSonar() {
    
  long inches, cm;
  
  pinMode(sigSonar, OUTPUT);  
  digitalWrite(sigSonar, LOW);
  delay(2);
  digitalWrite(sigSonar, HIGH);
  delay(10);
  digitalWrite(sigSonar, LOW);
  
  pinMode(sigSonar, INPUT);
  duration = pulseIn(sigSonar, HIGH);
  
  inches = microsecondsToInches(duration);
  cm = microsecondsToCentemeters(duration);
  /*
  emicSerial.print("Sinches ");
  emicSerial.print(inches);
  emicSerial.print(" cm, ");
  emicSerial.print(cm);
  emicSerial.print(" centemeters");
  emicSerial.print("\n");
  */
  if(lastCM!=cm){
    lastCM = cm;
      if(debugLevel){
        emicSerial.print("S ");
        emicSerial.print(cm);
        emicSerial.print("\n");
        while (emicSerial.read() != ':');   // Wait here until the Emic 2 responds with a ":" indicating it's ready to accept the next command
      }
  }
  //delay(500);
}
  
  long microsecondsToInches(long microseconds) {
    
    return microseconds / 74 /2;
  }
  
  long microsecondsToCentemeters(long microseconds) {
    
    return microseconds / 29 / 2;
  }

