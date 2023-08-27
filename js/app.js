
import interaction from "./ll-interaction.js"

import simulate from "./ll-simulator.js"

let simThread;

let {events} = interaction;

events.onframe = ()=>{
    if(!simThread)
        simThread = simulate(interaction.model,interaction.debug,interaction.updateComponent);
    else{
        if(interaction.debug.slow){
            if(simThread.next().done)
                simThread = undefined;
        }else{
            //Fullspeed.
            while(!simThread.next().done);
            simThread = undefined;
        }
    }
}



//import "./ai_sp.js"