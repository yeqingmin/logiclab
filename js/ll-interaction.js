import {THREE, events, scene, meshes, tweakpane, start} from "./ll-viewer.js"

import Wires from "./ll-wires.js"
let wires = new Wires({
    THREE,
    scene
});

// simulation

import emptyModel from "./net-empty.js";

let lastClicked;

let ctx={
    events,scene,meshes,tweakpane
}

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
        for(let i=0,w = ctx.model.wires,wi;(wi=w[i])&&(i<w.length);i++)
            if(((wi.pin0==ename)||(wi.pin1==ename)) && (!wi.hidden))
                deadPool.push(wi);
        deadPool.forEach(wi=>removeWire(wi));
        //console.log("clicked:",ename)
    }
}
)

let irnd = (rng)=>((Math.random() * rng) | 0)

let glowMaterials={}
let getGlowMaterial=(material)=>{
    let gm=glowMaterials[material.id];
    if(!gm){
        gm = glowMaterials[material.id] = material.clone();
        gm.emissiveMap = material.map;
        gm.emissive.set('white');
        gm.emissiveIntensity = 5;
    }
    return gm;
}
let setGlow = (name,glow)=>{
    let mled = getVisualNode(name);
    if(!mled.glowMaterial){
        mled.glowMaterial = getGlowMaterial(mled.material);
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
    let sw = ctx.model.components[o.name];
    sw.closed = o.on;
}

let nodesByName = {}
meshes.forEach(m=>nodesByName[m.name] = m)
let pins = Object.entries(nodesByName).filter(([key,value])=>key.startsWith('PIN')).map(e=>e[1]);

let debug = ctx.debug = {
    debug:false,
    slow:false,
    element:loader
}

Object.assign(debug.element.style,{
    position: 'absolute',
    left:'5px',
    top:'25px',
    zIndex:10,
    fontSize:'9px',
    display:'none'
})

const dbgtoggle = tweakpane.addInput(debug,'debug')
dbgtoggle.on('change',(v)=>{
    debug.element.style.display = v.value?'':'none'
})
const dbgslow = tweakpane.addInput(debug,'slow')

const btn = tweakpane.addButton({
    title: 'test',
    label: 'test',
})

let wireList = []
btn.on('click', ()=>{
    for (let i = 0; i < 10; i++){
        let pin0=pins[irnd(pins.length)];
        let pin1=pins[irnd(pins.length)];
        if(pin0==pin1)continue;
        let nwire = new wires.Wire(pin0.position,pin1.position)
        nwire.wire = addWire(pin0.name, pin1.name);
        wireList.push(nwire)
    }
    if(wireList.length>500)
        alert("Thrax asks: What's your deal?")
}
);

const clearbtn = tweakpane.addButton({
    title: 'clear',
    label: 'clear',
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
                let obj = ctx.model.components[hilightedObject.userData.elementName];
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
            ctx.model.components[hilightedObject.userData.elementName]?.type=='PIN';
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

let reset=()=>{
    ctx.model = structuredClone( emptyModel );
}


let addWire = (pin0,pin1)=>{
    let wire = {pin0,pin1}
    ctx.model.wires.push(wire);
    return wire;
}

let findWireId = (wire)=>{
    for(let i=0,w = ctx.model.wires,wi;(wi=w[i])&&(i<w.length);i++)
        if((wi.pin0==wire.pin0)&&(wi.pin1==wire.pin1))
            return i;
}

let removeWire = (wire)=>{
    let id = findWireId( wire )
    let w = ctx.model.wires[id];
    ctx.model.wires.splice(id,1);
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
    
    for (let f in ctx.model.components) {
        let e = ctx.model.components[f];
        if (e.type == 'SWITCH') {
            setSwitch(nodesByName[f],e.closed)
        }else if (e.type == 'LED'){
            setGlow(f,false)            
        }
    }
    ctx.model.wires.forEach((w)=>{
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


let loadStateLS = (name='logiclab')=>{
    if (localStorage[name]) {
        try {
            ctx.model = JSON.parse(localStorage[name])
        } catch {
            reset();
        }
    }
    rebuildView();
}

let loadStateDI = (name)=>{
    import(name).then( (mod) => (ctx.model = structuredClone(mod.default))&&rebuildView() )
}

let saveState = ()=>{
    localStorage.logiclab = JSON.stringify(ctx.model)
}

const loadbutton = tweakpane.addButton({
    title: 'load',
    label: 'load',
})

loadbutton.on('click', loadStateLS);

const savebutton = tweakpane.addButton({
    title: 'save',
    label: 'save',
})
savebutton.on('click', saveState);

tweakpane.addBlade({
  view: 'list',
  label: 'scene',
  options: [
    {text: '1 bit adder', value: './net-1bitadder.js'},
  ],
  value: '',
}).on('change',(e)=>{
    loadStateDI(e.value);
});

// Fire this puppy up.

events.onframe = ()=>{
    if (dragWire && dragWire.needsUpdate) {
        dragWire.setEnd(dragWire.end);
        dragWire.needsUpdate = false;
    }
}

ctx.updateComponent = (k,c,signal)=>{
    if(c.type=='LED')
        setGlow(k, !!signal);
}

loadStateLS();

start();

export default ctx;