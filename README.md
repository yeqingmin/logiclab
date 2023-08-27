# logiclab

this is a simulation of the LogicLabs device made by Johnson Davies:
http://www.technoblogy.com/show?4FFY

You can view/play with it here: https://manthrax.github.io/logiclab/index.html

[![image](https://github.com/manthrax/logiclab/assets/350247/3a76a563-de76-4a3d-b167-435646fed073)](https://manthrax.github.io/logiclab/index.html)

I saw this hardware device in a post on hacker news, and figured I wanted to play with it, but didn't have one.. so I made one in threejs.

How it was made:
  Board was modelled in blender. I started with a front and back jpeg of the original device.. used them to trace/model the board.
Then made single pins / switches / leds, and made instances on each point, and then naming everything nicely so I could find it later..
The .blend file is in the art folder.

App:
  The app is just a regular threejs app + effectscomposer/unrealbloom/gltfloader..
no package.json.. no builds.. threejs loaded from cdn.
Just index.html and a bunch of .js
The wires are done procedurally.. using ExtrudeGeometry.. 
LED "light" is done by swapping to a copy of the original material and copying the materials.map into the .emissiveMap as well, and then setting .emissive color to white..
Original nodelist was generated from the loaded GLB, but now is just loaded from JSON.
I was thinking of extending this aspect to load arbitrary board designs from blender.

Simulator:
  The sim is a list of "components" and "wires"
components are pins/switches/LEDs.. the wires are... wires.
There are invisible "wires" that connect components to their output/input pins.. and to connect pins in blocks to each other...
The visible user created wires are restricted to start and end on a pin.
that netlist is saved to some js or json/localStorage.

Sim loop:
  The simulator starts by putting a 1 signal on the Battery component.. and mark it as updated..
The simulation then loops through the list of wires..
Each time a wire is connected to a component marked updated.. the signal is propagated to the alternate pin the the wire is connected to... and that pin is marked as updated..
After each pass through the wires.. I loop through the components.. and adjust the visual representation of the components, mainly lighting up LEDs that have non-zero signal..

So the sim is pretty hacked and probably doesn't capture a lot of the true dynamics of digital logic sim, but it seems to handle the basics ok-ish. 

