# Stash Userscripts

## Performer Edit Panel, Dot Notation Weight, Height and Penis converter

Userscript to that attaches event listeners to the Weight, height and penis input fields to use dot notation to convert the non standard format to the standard format for each. I.e. Feet . Inches to cm for height. Pounds . Ounces to kg for weight and Inches . Inches to cm for penis length

The height and penis length event listeners listen for a regex match of up to two integers then the decimal point alongside another integer. That once matched will calculate and replace the input value.

The weight event listener, listens to a regex match of upto 4 integers then the decimal point and upto two integers after that. Upon entering one integer it will match but the calculation function is put on a set timeout along for entry of an additional integer.

## Note

For the calculation to work, it needs the decimal point and any integers after that to match and calculate.

I.e. to enter 5ft for height. I would enter 5.0

## Usage

Usage, for example if I want to add 5ft 7inches to the height input field. I would just enter, 5.7 and the value of the input field should automatically convert to 170 cm, the closest round integer of the calculation.

## Will eventually add to my forked repo of the Userscripts Bundle