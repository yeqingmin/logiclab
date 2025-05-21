import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Pane } from 'tweakpane';

@Component({
  selector: 'app-three-learning',
  templateUrl: './three-learning.component.html',
  styleUrls: ['./three-learning.component.css']
})
export class ThreeLearningComponent implements OnInit, AfterViewInit {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer!: EffectComposer;
  private controls!: OrbitControls;
  private tweakpane!: Pane;
  private mixer!: THREE.AnimationMixer;
  private loadCount = 0;
  private lastTime!: number;
  private meshes: THREE.Mesh[] = [];
  private cube!: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private dragPlane!: THREE.Mesh;
  private hilightedObject: any;
  private draggingObject: any;
  private delta = new THREE.Vector3();
  private events: any = {
    listeners: {},
    listen: (key: string, listener: Function) => {
      let listenerList = this.events.listeners[key] || (this.events.listeners[key] = []);
      listenerList.push(listener);
    },
    dispatch: (eventType: string, event: any) => {
      let list = this.events.listeners[eventType];
      list && list.forEach((e: Function) => e(eventType, event));
    }
  };

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.initScene();
    this.initLights();
    this.initControls();
    this.initPostProcessing();
    this.initEventListeners();
    this.loadModel();
  }

  ngAfterViewInit() {
    this.elementRef.nativeElement.appendChild(this.renderer.domElement);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.renderer.compile(this.scene, this.camera);
    this.renderer.setAnimationLoop(() => this.render());
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 3.5, 0);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    // Create cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    this.cube = new THREE.Mesh(geometry, material);
  }

  private initLights() {
    const directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(0, 30, 20);
    directionalLight.target.position.set(0, 0, 0);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight('white', 0.01);
    this.scene.add(ambientLight);

    this.setupShadows(directionalLight);
  }

  private setupShadows(light: THREE.DirectionalLight, mapSize = 1024, viewSize = 50) {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;

    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 200;
    light.shadow.camera.left = -viewSize;
    light.shadow.camera.top = viewSize;
    light.shadow.camera.right = viewSize;
    light.shadow.camera.bottom = -viewSize;
    light.shadow.camera.updateProjectionMatrix();
    light.shadow.bias = -0.0002;
    light.castShadow = true;
  }

  private initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minAzimuthAngle = this.controls.maxAzimuthAngle = 0;
  }

  private initPostProcessing() {
    const params = {
      threshold: 1,
      strength: 0.5,
      radius: 0,
      exposure: 1
    };

    const bloomSize = new THREE.Vector2(window.innerWidth, window.innerHeight);
    const bloomPass = new UnrealBloomPass(bloomSize, params.strength, params.radius, params.threshold);
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;
    bloomPass.setSize(2000, 1000);

    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = Math.pow(params.exposure, 4);

    const outputPass = new OutputPass();
    this.composer = new EffectComposer(this.renderer);
    const renderScene = new RenderPass(this.scene, this.camera);
    
    this.composer.addPass(renderScene);
    this.composer.addPass(bloomPass);
    this.composer.addPass(outputPass);

    // Initialize Tweakpane
    this.tweakpane = new Pane();
    const folder = this.tweakpane.addFolder({
      title: 'options',
      expanded: false
    });

    folder.addInput(bloomPass, 'threshold', { min: 0, max: 5 });
    folder.addInput(bloomPass, 'strength', { min: 0, max: 10 });
    folder.addInput(bloomPass, 'radius', { min: 0, max: 1.5, step: 0.0001 });
    folder.addInput(params, 'exposure', { min: 0.5, max: 4 })
      .on('change', (e) => {
        this.renderer.toneMappingExposure = Math.pow(params.exposure, e.value);
      });
  }

  private initEventListeners() {
    window.addEventListener('pointerdown', (e) => this.events.dispatch('mousedown', e));
    window.addEventListener('pointermove', (e) => this.events.dispatch('mousemove', e));
    window.addEventListener('pointerup', (e) => this.events.dispatch('mouseup', e));
  }

  private async loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync('assets/logiclab.glb');
      gltf.scene.traverse(object => {
        if ((object as THREE.Mesh).isMesh) {
          this.meshes.push(object as THREE.Mesh);
        }
      });
      this.scene.add(gltf.scene);
      this.setupRaycastScene();
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  private setupRaycastScene() {
    const raycastScene = new THREE.Scene();
    const invisMaterial = new THREE.MeshBasicMaterial({
      color: 'blue',
      transparent: true,
      wireframe: false,
      opacity: 0.1
    });

    const hbox = this.cube.clone();
    hbox.material = invisMaterial;

    this.meshes.forEach(m => {
      const bx = hbox.clone();
      const bounds = new THREE.Box3().setFromObject(m);
      bounds.getCenter(bx.position);
      bounds.getSize(bx.scale);
      bx.scale.multiplyScalar(1.01);
      const ud = bx.userData;
      ud.elementName = m.name;
      raycastScene.add(bx);
    });
  }

  private resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
  }

  private render() {
    const time = performance.now();
    this.lastTime = this.lastTime || time;
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.events.dispatch('frame');
    this.mixer.update(dt);
    this.composer.render();
    this.controls.update();
  }
}