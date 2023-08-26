import {THREE, events, scene, meshes, tweakpane} from "./ll-viewer.js"

let {min,max}=Math;
let lastClicked;

events.listen('click', (e,{object,event})=>{
    let ename = object.userData.elementName
    let obj = scene.getObjectByName(ename)

    
    if(event.button==0){
        if (obj.name.startsWith('SWITCH')) {
            setSwitch(obj, !obj.on);
        }
        
        if(lastClicked){
            //console.log(`{pin0:'${lastClicked}',pin1:'${ename}',hidden:true},`)
            lastClicked = undefined;
        }else lastClicked = object.userData.elementName
    }
    if(event.button==2){
        //Delete the nodes wires
        
        let deadPool=[]
        for(let i=0,w = model.wires,wi;(wi=w[i])&&(i<w.length);i++)
            if(((wi.pin0==ename)||(wi.pin1==ename)) && (!wi.hidden))
                deadPool.push(wi);
        deadPool.forEach(wi=>removeWire(wi));
        //console.log("clicked:",ename)
    }
}
)

import Wires from "./wires.js"
let wires = new Wires({
    THREE,
    scene
});

let irnd = (rng)=>((Math.random() * rng) | 0)



let setGlow = (name,glow)=>{

    let mled = getVisualNode(name);
    if(!mled.glowMaterial){

        mled.glowMaterial = mled.material.clone();
        mled.glowMaterial.emissiveMap = mled.material.map;
        mled.glowMaterial.emissive.set('white');
        mled.glowMaterial.emissiveIntensity = 5;
        //console.log("LIT:",name)
    }
    if (glow) {
        if (!mled.saveMaterial) {
            mled.saveMaterial = mled.material;
            mled.material = mled.glowMaterial;
        }
    } else {
        if (mled.saveMaterial) {
            mled.material = mled.saveMaterial;
            mled.saveMaterial = undefined;
        }
    }
}

let setSwitch = (o,on=o.on)=>{
    if (o.on == on)
        return;
    o.on = on;
    o.children[0].position.z = Math.abs(o.children[0].position.z) * (on ? -1 : 1);
    //Flip the switch nub..
    let sw = model.components[o.name];
    sw.closed = o.on;
}

let nodesByName = {}
meshes.forEach(m=>nodesByName[m.name] = m)
let pins = Object.entries(nodesByName).filter(([key,value])=>key.startsWith('PIN')).map(e=>e[1]);

const btn = tweakpane.addButton({
    title: 'test',
    label: 'test',
    // optional
})

let wireList = []
btn.on('click', ()=>{
    for (let i = 0; i < 10; i++)
        wireList.push(new wires.Wire(pins[irnd(pins.length)].position,pins[irnd(pins.length)].position))
}
);

const clearbtn = tweakpane.addButton({
    title: 'clear',
    label: 'clear',
    // optional
})

clearbtn.on('click', ()=>{
    reset();
    rebuildView()

}
);

let dragWire;

events.listen('drag', (e,{object, delta, hilightedObject})=>{
    let name = object.userData.elementName;
    if (name.startsWith("PIN")) {
        let end = delta.clone().add(object.position);
        if (!dragWire) {
            dragWire = new wires.Wire(object.position,end);
        } else {
            dragWire.end.copy(end);
            if (hilightedObject){
                let obj = model.components[hilightedObject.userData.elementName];
                if(obj && obj.type=='PIN')
                    dragWire.end.copy(hilightedObject.position)
            }
            dragWire.needsUpdate = true;
        }
    }
    //console.log('drag',name,delta)
}
);

events.listen('drop', (e,{object, delta, hilightedObject})=>{
    if (dragWire) {
        let isValidWire = (object !== hilightedObject) && 
            hilightedObject && 
            model.components[hilightedObject.userData.elementName]?.type=='PIN';
        if (isValidWire) {
            dragWire.pin0 = object.userData.elementName;
            dragWire.pin1 = hilightedObject.userData.elementName;
            dragWire.setEnd(hilightedObject.position)
            dragWire.wire = addWire(dragWire.pin0, dragWire.pin1)
            wireList.push(dragWire);

        } else
            dragWire.dispose();
    }
    dragWire = undefined;
    //console.log('drop',object.name)
}
)

// simulation

let model;

let reset=()=>{
  model = {
    components:{
        BATTERY: {type: 'SOURCE'},
        SWITCH000: {type: 'SWITCH', closed: false},
        SWITCH001: {type: 'SWITCH', closed: false},
        SWITCH002: {type: 'SWITCH', closed: false},
        SWITCH003: {type: 'SWITCH', closed: false},
        SWITCH004: {type: 'SWITCH', closed: false},
        MLED000: {type: 'LED',},
        MLED001: {type: 'LED',},
        MLED002: {type: 'LED',},
        MLED003: {type: 'LED',},
        MLED004: {type: 'LED',},
        LED001: {type: 'LED',},
        LED002: {type: 'LED',},
        LED003: {type: 'LED',},
        LED004: {type: 'LED',},
        LED005: {type: 'LED',},
        AND0:{type:'GATE',op:'AND',i0:'PIN013',i1:'PIN015',o0:'PIN059'},
        AND1:{type:'GATE',op:'AND',i0:'PIN017',i1:'PIN019',o0:'PIN065'},
        
        NAND0:{type:'GATE',op:'NAND',i0:'PIN021',i1:'PIN023',o0:'PIN071'},
        NAND1:{type:'GATE',op:'NAND',i0:'PIN025',i1:'PIN027',o0:'PIN077'},
        
        OR0:{type:'GATE',op:'OR',i0:'PIN029',i1:'PIN031',o0:'PIN107'},
        OR1:{type:'GATE',op:'OR',i0:'PIN033',i1:'PIN035',o0:'PIN113'},
        NOR0:{type:'GATE',op:'NOR',i0:'PIN037',i1:'PIN039',o0:'PIN119'},
        NOR1:{type:'GATE',op:'NOR',i0:'PIN041',i1:'PIN043',o0:'PIN125'},
        
        XOR0:{type:'GATE',op:'XOR',i0:'PIN045',i1:'PIN047',o0:'PIN131'},
        XOR1:{type:'GATE',op:'XOR',i0:'PIN049',i1:'PIN051',o0:'PIN137'},
        NOT0:{type:'GATE',op:'NOT',i0:'PIN053',o0:'PIN143'},
        NOT1:{type:'GATE',op:'NOT',i0:'PIN055',o0:'PIN149'},
    },
    wires:[
        {pin0:'BATTERY',pin1:'SWITCH000',hidden:true},
        {pin0:'SWITCH000',pin1:'SWITCH001',hidden:true},
        {pin0:'SWITCH000',pin1:'SWITCH002',hidden:true},
        {pin0:'SWITCH000',pin1:'SWITCH003',hidden:true},
        {pin0:'SWITCH000',pin1:'SWITCH004',hidden:true},
        {pin0:'SWITCH000',pin1:'MLED000',hidden:true},
        {pin0:'SWITCH001',pin1:'MLED001',hidden:true},
        {pin0:'SWITCH002',pin1:'MLED002',hidden:true},
        {pin0:'SWITCH003',pin1:'MLED003',hidden:true},
        {pin0:'SWITCH004',pin1:'MLED004',hidden:true},
        {pin0:'PIN169',pin1:'LED001',hidden:true},
        {pin0:'PIN171',pin1:'LED002',hidden:true},
        {pin0:'PIN173',pin1:'LED003',hidden:true},
        {pin0:'PIN175',pin1:'LED004',hidden:true},
        {pin0:'PIN177',pin1:'LED005',hidden:true},
        //Switches
        {pin0:'SWITCH001',pin1:'PIN081',hidden:true},
        {pin0:'SWITCH001',pin1:'PIN083',hidden:true},
        {pin0:'SWITCH001',pin1:'PIN085',hidden:true},
        
        {pin0:'SWITCH002',pin1:'PIN087',hidden:true},
        {pin0:'SWITCH002',pin1:'PIN089',hidden:true},
        {pin0:'SWITCH002',pin1:'PIN091',hidden:true},
        
        {pin0:'SWITCH003',pin1:'PIN093',hidden:true},
        {pin0:'SWITCH003',pin1:'PIN095',hidden:true},
        {pin0:'SWITCH003',pin1:'PIN097',hidden:true},
        
        {pin0:'SWITCH004',pin1:'PIN099',hidden:true},
        {pin0:'SWITCH004',pin1:'PIN101',hidden:true},
        {pin0:'SWITCH004',pin1:'PIN103',hidden:true},

        
        //Junctions
        {pin0:'PIN059',pin1:'PIN057',hidden:true},
        {pin0:'PIN059',pin1:'PIN061',hidden:true},
        {pin0:'PIN065',pin1:'PIN063',hidden:true},
        {pin0:'PIN065',pin1:'PIN067',hidden:true},
        {pin0:'PIN071',pin1:'PIN069',hidden:true},
        {pin0:'PIN071',pin1:'PIN073',hidden:true},
        {pin0:'PIN077',pin1:'PIN075',hidden:true},
        {pin0:'PIN077',pin1:'PIN079',hidden:true},
        {pin0:'PIN107',pin1:'PIN105',hidden:true},
        {pin0:'PIN107',pin1:'PIN109',hidden:true},
        {pin0:'PIN113',pin1:'PIN111',hidden:true},
        {pin0:'PIN113',pin1:'PIN115',hidden:true},
        {pin0:'PIN119',pin1:'PIN117',hidden:true},
        {pin0:'PIN119',pin1:'PIN121',hidden:true},
        {pin0:'PIN125',pin1:'PIN123',hidden:true},
        {pin0:'PIN125',pin1:'PIN127',hidden:true},
        {pin0:'PIN131',pin1:'PIN129',hidden:true},
        {pin0:'PIN131',pin1:'PIN133',hidden:true},
        {pin0:'PIN137',pin1:'PIN135',hidden:true},
        {pin0:'PIN137',pin1:'PIN139',hidden:true},
        {pin0:'PIN143',pin1:'PIN141',hidden:true},
        {pin0:'PIN143',pin1:'PIN145',hidden:true},
        {pin0:'PIN149',pin1:'PIN147',hidden:true},
        {pin0:'PIN149',pin1:'PIN151',hidden:true},

        
    ]
}
    pins.forEach(p=>{
        model.components[p.name]={type:'PIN'}
    })
}


let addWire = (pin0,pin1)=>{
    let wire = {pin0,pin1}
    model.wires.push(wire);
    return wire;
}

let findWireId = (wire)=>{
    for(let i=0,w = model.wires,wi;(wi=w[i])&&(i<w.length);i++)
        if((wi.pin0==wire.pin0)&&(wi.pin1==wire.pin1))
            return i;
}

let removeWire = (wire)=>{
    let id = findWireId( wire )
    let w = model.wires[id];
    model.wires.splice(id,1);
    let deadPool = []
    deadPool = wireList.filter(wv=>(wv.wire===wire))
    wireList=wireList.filter(wv=>(wv.wire!==wire))
    deadPool.forEach(w=>w.dispose())
}

let getVisualNode=(name)=>{
    return nodesByName[name]
}
let rebuildView=()=>{
    wireList.forEach(w=>w.dispose())
    wireList.length = 0;
    
    for (let f in model.components) {
        let e = model.components[f];
        if (e.type == 'SWITCH') {
            setSwitch(nodesByName[f],e.closed)
        }else if (e.type == 'LED'){
            setGlow(f,false)            
        }
    }
    model.wires.forEach((w)=>{
        if(w.hidden) return;
        let p0 = getVisualNode(w.pin0)
        let p1 = getVisualNode(w.pin1)
        let wireView = new wires.Wire(p0.position,p1.position)
        wireView.pin0=w.pin0;
        wireView.pin1=w.pin1;
        wireView.wire = w;
        wireList.push(wireView)
    })
}

reset();
rebuildView()


let loadStateLS = ()=>{
    if (localStorage.logiclab) {
        try {
            model = JSON.parse(localStorage.logiclab)
        } catch {
            reset();
        }
    }
    rebuildView();
}

//loadState();

let saveState = ()=>{
    localStorage.logiclab = JSON.stringify(model)
}

const loadbutton = tweakpane.addButton({
    title: 'load',
    label: 'load',
    // optional
})

loadbutton.on('click', loadStateLS);

const savebutton = tweakpane.addButton({
    title: 'save',
    label: 'save',
    // optional
})
savebutton.on('click', saveState);


events.onframe = ()=>{
    if (dragWire && dragWire.needsUpdate) {
        dragWire.setEnd(dragWire.end);
        dragWire.needsUpdate = false;
    }
    simulate();
}


let simFrame = 0;
let simulate=()=>{
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
        }else if(c.type=='LED')
            setGlow(k, false);
        else if(c.type=='GATE')
            gates[k]=c;
    }
    
    let a = model.wires;
    let hadUpdate = true;

    if(co.SWITCH000 && ( ! co.SWITCH000.closed))
        hadUpdate = false;    
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
            if(cto.type=='LED')
                setGlow(to, !!sig);
            
            //console.log(from,'-->',to,simFrame)
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
        }
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