import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Pane } from 'tweakpane';

@Injectable({
  providedIn: 'root'
})
export class LogicLabService {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;
  private mixer: THREE.AnimationMixer;
  private tweakpane: Pane;
  private meshes: THREE.Mesh[] = [];
  private animationFrame: number;

  private bloomPass: UnrealBloomPass;
  private params = {
    threshold: 1,
    strength: 0.5,
    radius: 0,
    exposure: 1
  };

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 3.5, 0);
  }

  async initialize(container: HTMLElement) {
    this.setupRenderer(container);
    this.setupControls();
    this.setupLights();
    this.setupPostProcessing();
    this.setupTweakPane();
    
    await this.loadModel();
    
    this.setupEventListeners();
    this.animate();
  }

  private setupRenderer(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);
  }

  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minAzimuthAngle = 0;
    this.controls.maxAzimuthAngle = 0;
  }

  private setupLights() {
    const directionalLight = new THREE.DirectionalLight();
    directionalLight.position.set(0, 30, 20);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight('white', 0.01);
    this.scene.add(ambientLight);
  }

  private setupPostProcessing() {
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.params.strength,
      this.params.radius,
      this.params.threshold
    );

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const outputPass = new OutputPass();

    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(outputPass);
  }

  private setupTweakPane() {
    this.tweakpane = new Pane();
    const folder = this.tweakpane.addFolder({ title: 'options', expanded: false });

    folder.addInput(this.bloomPass, 'threshold', { min: 0, max: 5 });
    folder.addInput(this.bloomPass, 'strength', { min: 0, max: 10 });
    folder.addInput(this.bloomPass, 'radius', { min: 0, max: 1.5, step: 0.0001 });
  }

  private async loadModel() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync('assets/logiclab.glb');
    
    gltf.scene.traverse(object => {
      if ((object as THREE.Mesh).isMesh) {
        this.meshes.push(object as THREE.Mesh);
      }
    });

    this.scene.add(gltf.scene);
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  private animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    
    this.controls.update();
    this.composer.render();
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.tweakpane?.dispose();
    this.renderer?.dispose();
    this.scene?.clear();
  }
}