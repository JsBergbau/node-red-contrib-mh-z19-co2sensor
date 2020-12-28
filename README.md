# MH-Z19 CO2 Sensor

With this node you can read the CO2 values of your MH-Z19 CO2 sensor. You can also use this node to configure your sensor.

## Installation and Prerequisites

On Raspberry PI there is the serial console default on your serial port. Disable it to use it with your MH-Z19 CO2 sensor as described in the official docs https://www.raspberrypi.org/documentation/configuration/uart.md

Connect 5V (PIN 2 or 4) to Vin of CO2 sensor.

Connect GND (eg. PIN 5) to GND of CO2 sensor.

Connect TXD (PIN 8) to Rx of CO2 sensor.

Connect RXD (PIN  10) to Tx of CO2 sensor.

## Usage
Set `msg.payload` to `getCO2` to get current CO2 values or to `ABCOff` to disable error prone automatic calibration every 24 hours. More in the node’s help tab. 

## License
GPLv3