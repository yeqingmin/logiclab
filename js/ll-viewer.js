import*as Viewer from "./viewer.js"
let {THREE, scene, camera, renderer, composer, controls, cube, urlparams, loadGLTF, mixer, resize, events, tweakpane, pointLight, ambientLight, start} = Viewer;

camera.position.set(0, 3.5, 0);
controls.enableDamping = true;

let glb = await loadGLTF("assets/logiclab.glb")

let meshes = []
glb.scene.traverse(e=>e.isMesh && meshes.push(e))
let hbox = cube.clone();

let invisMaterial = new THREE.MeshBasicMaterial({
    color: 'blue',
    transparent: true,
    wireframe: false,
    opacity: .001
})

hbox.material = invisMaterial;
let raycastScene = new THREE.Scene();
scene.add(raycastScene);
meshes.forEach(m=>{
    let bx = hbox.clone();
    let bounds = new THREE.Box3().setFromObject(m);
    bounds.getCenter(bx.position);
    bounds.getSize(bx.scale)
    bx.scale.multiplyScalar(1.01)
    let ud = bx.userData;
    ud.elementName = m.name;
    raycastScene.add(bx)
}
)
//meshes.forEach(m=>console.log(m.name))
scene.add(glb.scene)

let raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(eventType, event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

let hoverMaterial = new THREE.MeshStandardMaterial({
    color: 'green',
    transparent: false,
    opacity: .1,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
   // depthFunc: THREE.GreaterDepth,
    depthWrite:false,
    emissive:'green',
    emissiveIntensity:5.
})

let hilightedObject;
let draggingObject;
let delta = new THREE.Vector3()
let dragPlane = new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({
    color: 'red',
    transparent: true,
    opacity: .01
}))
dragPlane.geometry.rotateX(Math.PI * -.5)
//scene.add(dragPlane);

// update the picking ray with the camera and pointer position
let raycast = (eventType,event)=>{
    onPointerMove(eventType, event);
    raycaster.setFromCamera(pointer, camera);
    raycastScene.traverse(e=>{
        if (e.saveMaterial) {
            e.material = e.saveMaterial;
            e.saveMaterial = undefined;
        }
    }
    )
    const intersects = raycaster.intersectObject(raycastScene, true);
    hilightedObject = undefined;
    if (intersects.length) {
        let o = intersects[0].object;
        if (o.userData.elementName !== 'Cube') {
            o.saveMaterial = o.material;
            o.material = hoverMaterial;
            hilightedObject = o;
        }
    }

    if (eventType == 'mousedown') {
        draggingObject = hilightedObject;
    }
    if (eventType == 'mouseup') {
        if (draggingObject) {
            events.dispatch('drop', {
                object: draggingObject,
                delta,
                hilightedObject
            })
            if (draggingObject == hilightedObject) {
                events.dispatch('click', {object:draggingObject,event})

            }
        }
        hilightedObject = draggingObject = undefined;
    }
    controls.enabled = !draggingObject;
    if ((eventType == 'mousemove') || (eventType == 'mousedown')) {
        //Drag
        if (draggingObject) {
            let hits = raycaster.intersectObject(dragPlane);
            if (hits.length) {
                delta.copy(hits[0].point).sub(draggingObject.position);
                dragPlane.position.copy(hits[0].point)
                dragPlane.updateMatrixWorld();
                events.dispatch('drag', {
                    object: draggingObject,
                    delta,
                    hilightedObject
                })
                dragPlane.position.copy(draggingObject.position);
            }
        }
    }

}

controls.minAzimuthAngle = controls.maxAzimuthAngle = 0;

events.onmousedown = raycast
events.onmousemove = raycast
events.onmouseup = raycast

export {THREE, scene, meshes, events, tweakpane}
