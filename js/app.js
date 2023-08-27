
import interaction from "./ll-interaction.js"

import simulate from "./ll-simulator.js"


let {events} = interaction;

let simThread;
let currentModel;
events.onframe = ()=>{
    if((!simThread)||(currentModel!==interaction.model)){
        currentModel = interaction.model;
        simThread = simulate(interaction.model,interaction.debug,interaction.updateComponent);
    }else{
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
