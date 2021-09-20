# SPDX-FileCopyrightText: 2021 Kattni Rembor for Adafruit Industries
# SPDX-License-Identifier: MIT

"""
This example uses AnimationsSequence to display multiple animations in sequence, at a five second
interval.
#
For NeoPixel FeatherWing. Update pixel_pin and pixel_num to match your wiring if using
a different form of NeoPixels.
"""
import board
import neopixel
import supervisor
import json

from adafruit_led_animation.animation.sparkle import Sparkle
from adafruit_led_animation.animation.sparklepulse import SparklePulse
from adafruit_led_animation.sequence import AnimationSequence
from adafruit_led_animation.animation.rainbowsparkle import RainbowSparkle
from adafruit_led_animation.animation.rainbow import Rainbow

from adafruit_led_animation.color import BLUE, JADE, RAINBOW

# Update to match the pin connected to your NeoPixels
pixel_pin = board.GP15
# Update to match the number of NeoPixels you have connected
pixel_num = 50

pixels = neopixel.NeoPixel(pixel_pin, pixel_num, brightness=0.5, auto_write=False)

sparkle = Sparkle(pixels, speed=0.05, color=BLUE, num_sparkles=5)
sparkle_pulse = SparklePulse(pixels, speed=0.05, period=10, color=BLUE)
rainbow_sparkle = RainbowSparkle(pixels, speed=0.1, num_sparkles=15)
rainbow = Rainbow(pixels, speed=0.1, period=2)

animation = sparkle


def process_command(command):
    global animation
    try:
        cmd = json.loads(command)
        print(cmd)
    except ValueError:
        print("Command wasn't json, shame")

    if(cmd['animation'] == 'sparkle'):
        # Defaults
        speed = 0.05
        color = BLUE
        num_sparkles = 5
    
        if "speed" in cmd:
            speed = cmd['speed']
        
        if "color" in cmd:
            color = (cmd['color']['r'], cmd['color']['g'], cmd['color']['b'])
        
        if "sparkles" in cmd:
            num_sparkles = cmd['sparkles']

        animation = Sparkle(pixels, speed=speed, color=color, num_sparkles=num_sparkles)

    elif(cmd['animation'] == 'sparkle_pulse'):
        # Defaults
        speed = 0.05
        color = BLUE
        period = 10
    
        if "speed" in cmd:
            speed = cmd['speed']
        
        if "color" in cmd:
            color = (cmd['color']['r'], cmd['color']['g'], cmd['color']['b'])
        
        if "period" in cmd:
            period = cmd['period']

        animation = SparklePulse(pixels, speed=speed, color=color, period=period)

    elif(cmd['animation'] == 'rainbow_sparkle'):
        # Defaults
        speed = 0.05
        num_sparkles = 5
    
        if "speed" in cmd:
            speed = cmd['speed']
        
        
        if "sparkles" in cmd:
            num_sparkles = cmd['sparkles']

        animation = RainbowSparkle(pixels, speed=speed, num_sparkles=num_sparkles)
    elif(cmd['animation'] == 'rainbow'):
        # Defaults
        speed = 0.05
        period = 5
    
        if "speed" in cmd:
            speed = cmd['speed']
        
        
        if "period" in cmd:
            period = cmd['period']

        animation = Rainbow(pixels, speed=speed, period=period)
    else:
        print("unknown command")




print("Hello World!");
while True:
    if supervisor.runtime.serial_bytes_available:
        value = input().strip()
        print(f"Received: {value}\r")
        process_command(value)
    animation.animate()
