
let {min,max}=Math;

let simFrame = 0;
let simulate=function* (model,debug,componentSignalChanged){
    let frames={}
    let signals={}
    simFrame++;

    let co = model.components;
    //set all source voltages and frames
    let gates = {}
    for(let k in co){
        let c = co[k];
        if(c.type == 'SOURCE'){
            frames[k]=simFrame;
            signals[k]=1;
        }
        else if(c.type=='GATE')
            gates[k]=c;
    }
    
    let a = model.wires;
    let hadUpdate = true;

    if(co.SWITCH000 && ( ! co.SWITCH000.closed))
        hadUpdate = false;
    let log = []
    while(hadUpdate){
        hadUpdate = false;
        let touchedGates={}
        //Update the wires
        for(let i=0;i<a.length;i++){
            let e = a[i];
            let f0=frames[e.pin0]|0;
            let f1=frames[e.pin1]|0;
            if(f0==f1)continue;
            hadUpdate = true;
            let from;
            let to;
            if(f0<f1){
                from = e.pin1;
                to = e.pin0;              
            }else{
                from = e.pin0;
                to = e.pin1;
            }
            let cto = co[to];
            let cfrom = co[from];
            let sig = signals[from]|0;
            let ftime = frames[from];
            if(cfrom.type=='SWITCH')
            {
                if( ! cfrom.closed ) sig = 0; 
            }
            
            signals[to] = sig;
            frames[to] = ftime;
            componentSignalChanged(to,cto,sig);

            debug.debug && log.push(`${from}-->${to},${sig},${simFrame}`)
            //console.log()
            
            yield;
        }
        //Update the gates...
        if(!hadUpdate){
            for(let k in gates){
                let gate=gates[k]
                if(frames[k]!=simFrame){
                    if((frames[gate.i0]==simFrame)&&(gate.i1?(frames[gate.i1]==simFrame):true)){
                        frames[k]=simFrame;
                        
                        signals[gate.o0] = gateOps[gate.op](signals,gate.i0,gate.i1);
                        
                        frames[gate.o0] = simFrame;
                        hadUpdate = true;
                    }
                }

            }
            if(!hadUpdate){
                debug.debug && (debug.element.innerText=log.join('\n'));
            }
        }//else
         //   yield;

    }
    for(let k in co){
        let c = co[k];
        componentSignalChanged(k,c,signals[k])
    }
}

let gateOps={
    AND :(signals,i0,i1)=>min(signals[i0],signals[i1]),
    NAND:(signals,i0,i1)=>min(signals[i0],signals[i1]) ? 0:1,
    OR  :(signals,i0,i1)=>max(signals[i0],signals[i1]),
    NOR :(signals,i0,i1)=>max(signals[i0],signals[i1]) ? 0:1,
    XOR :(signals,i0,i1)=>signals[i0] != signals[i1]   ?1:0,
    NOT :(signals,i0,i1)=>signals[i0] ? 0 : 1,
}

export default simulate;