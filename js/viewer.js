import*as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

import Stats from 'three/addons/libs/stats.module'
//import Draggable from "./draggable.js"
//import {SkeletonHelper} from 'three/addons/helpers/SkeletonHelper.js';

const tweakpane = new Tweakpane.Pane({//container: document.querySelector('#tweakpane'),
});
//Draggable(tweakpane.element)
tweakpane.element.parentElement.style.zIndex = 10;
tweakpane.Pane = Tweakpane.Pane;
let urlparams = new URLSearchParams(window.location.search);
const loadGLTF = (path)=>{
    return new Promise((resolve,reject)=>{
        const loader = new GLTFLoader();
        loader.load(path, (gltf)=>{
            resolve(gltf);
        }
        )
    }
    )
}

//video.style.visibility = 'hidden'

// Set up three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55,window.innerWidth / window.innerHeight,0.1,100);
scene.add(camera);
camera.position.z = 2;

const stats = new Stats()
document.body.appendChild(stats.dom)
stats.dom.style.left = '40px';
stats.dom.style.top = '40px';

//Draggable(stats.dom)
//let skeletonHelper = new SkeletonHelper();

const renderer = new THREE.WebGLRenderer({
    alpha: true
});

//if(window.devicePixelRatio>1)
//    renderer.setPixelRatio(1);//window.devicePixelRatio * 2.);

document.body.appendChild(renderer.domElement);

// Create a rotating cube
const geometry = new THREE.BoxGeometry(1,1,1);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
const cube = new THREE.Mesh(geometry,material);

// Set up post-processing

const params = {
    threshold: 1.,
    strength: .5,
    radius: 0,
    exposure: 1
};

let bloomSize = new THREE.Vector2(window.innerWidth,window.innerHeight);
const bloomPass = new UnrealBloomPass(bloomSize,params.strength,params.radius,params.threshold);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;
bloomPass.setSize(2000,1000)
renderer.toneMappingExposure=params.exposure;
tweakpane.addInput(bloomPass, 'threshold', {
    min: 0.,
    max: 5
})
tweakpane.addInput(bloomPass, 'strength', {
    min: 0.,
    max: 10
})
tweakpane.addInput(bloomPass, 'radius', {
    min: 0.,
    max: 1.5,
    step:.0001,
})
tweakpane.addInput(params, 'exposure', {
    min: .5,
    max: 4
}).on('change', (e)=>{
    renderer.toneMappingExposure = Math.pow(params.exposure, e.value);
}
)

renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = Math.pow(params.exposure, 4);

const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
let renderScene = new RenderPass(scene,camera);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

let mixer = new THREE.AnimationMixer();

let resize = ()=>{
    let w = window.innerWidth;
    let h = window.innerHeight;

    // Update the camera's aspect ratio and projection matrix
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Update the renderer's size
    renderer.setSize(w, h, false);
    composer.setSize(w, h)
}

resize();

window.addEventListener('resize', resize);

let listeners = {}

let listen = (key,listener)=>{
    let listenerList = listeners[key] || (listeners[key] = [])
    listenerList.push(listener)

}
let events = {
    listen,
    set onframe(listener) {
        listen('frame', listener)
    },
    set onmousemove(listener) {
        listen('mousemove', listener)
    },
    set onmousedown(listener) {
        listen('mousedown', listener)
    },
    set onmouseup(listener) {
        listen('mouseup', listener)
    },
    remove(event, listener) {
        listeners[event].splice(listeners.event, indexOf(listener), 1);
    },
    dispatch(eventType, event) {
        let list = listeners[eventType];
        list && list.forEach(e=>e(eventType, event));
    }
}
window.addEventListener('pointerdown', (e)=>events.dispatch('mousedown', e));
window.addEventListener('pointermove', (e)=>events.dispatch('mousemove', e));
window.addEventListener('pointerup', (e)=>events.dispatch('mouseup', e));

let lastTime;

import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
let controls = new OrbitControls(camera,renderer.domElement);

function render() {
    let time = performance.now()
    lastTime = lastTime || time;
    let dt = (time - lastTime) / 1000;
    lastTime = time;

    events.dispatch('frame')

    mixer.update(dt);

    composer.render();

    stats.update()

    controls.update();
}

let shadowSetup = (light,mapSize=1024,viewSize=50)=>{
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    //THREE.PCFSoftShadowMap;

    //Set up shadow properties for the light
    light.shadow.mapSize.width = mapSize;
    // default
    light.shadow.mapSize.height = mapSize;
    // default
    light.shadow.camera.near = 1.;
    // default
    light.shadow.camera.far = 200;
    // default

    light.shadow.camera.left = -viewSize;
    light.shadow.camera.top = viewSize;
    light.shadow.camera.right = viewSize;
    light.shadow.camera.bottom = -viewSize;
    light.shadow.camera.updateProjectionMatrix();

    //    light.shadow.radius = .75;
    //    light.shadow.blurSamples = 8;
    light.shadow.bias = -0.0002;
    //-0.0005;
    light.castShadow = true;
    // default false
}
;

let directionalLight = new THREE.DirectionalLight();
directionalLight.position.set(0, 30, 20)
directionalLight.target.position.set(0, 0, 0)
scene.add(directionalLight);

shadowSetup(directionalLight);

let pointLight = new THREE.PointLight('white',1,20);
//camera.add(pointLight)

let ambientLight = new THREE.AmbientLight('white',.01);

scene.add(ambientLight);

renderer.setAnimationLoop(render);

export {THREE, scene, camera, renderer, composer, cube, urlparams, loadGLTF, mixer, events, resize, tweakpane, pointLight, ambientLight, directionalLight, controls}
