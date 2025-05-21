import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { WiresService } from './wires.service';
import { LogicLabModel, Component } from '../models/types';
import { emptyModel } from '../models/empty-model';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private scene: THREE.Scene;
  model: LogicLabModel = emptyModel;
  private nodesByName: { [key: string]: THREE.Object3D } = {};
  private wireList: any[] = [];
  private lastClicked?: string;
  private dragWire?: any;
  private glowMaterials: { [key: string]: THREE.Material } = {};
  debug = {
    debug: false,
    slow: false,
    element: document.getElementById('loader')
  };

  constructor(private wiresService: WiresService) {}

  initialize(scene: THREE.Scene, meshes: THREE.Object3D[]) {
    this.scene = scene;
    this.setupNodes(meshes);
    this.wiresService.initialize(scene);
    this.reset();
    this.rebuildView();
  }

  private setupNodes(meshes: THREE.Object3D[]) {
    meshes.forEach(m => this.nodesByName[m.name] = m);
  }

  private getGlowMaterial(material: THREE.Material) {
    let gm = this.glowMaterials[material.uuid];
    if (!gm) {
      gm = this.glowMaterials[material.uuid] = (material as THREE.MeshStandardMaterial).clone();
      (gm as THREE.MeshStandardMaterial).emissiveMap = (material as THREE.MeshStandardMaterial).map;
      (gm as THREE.MeshStandardMaterial).emissive.set('white');
      (gm as THREE.MeshStandardMaterial).emissiveIntensity = 5;
    }
    return gm;
  }

  setGlow(name: string, glow: boolean) {
    const mled = this.getVisualNode(name) as THREE.Mesh;
    if (!mled.userData.glowMaterial) {
      mled.userData.glowMaterial = this.getGlowMaterial(mled.material);
    }
    if (glow) {
      if (!mled.userData.saveMaterial) {
        mled.userData.saveMaterial = mled.material;
        mled.material = mled.userData.glowMaterial;
      }
    } else {
      if (mled.userData.saveMaterial) {
        mled.material = mled.userData.saveMaterial;
        mled.userData.saveMaterial = undefined;
      }
    }
  }

  setSwitch(o: any, on = o.on) {
    if (o.on === on) return;
    o.on = on;
    o.children[0].position.z = Math.abs(o.children[0].position.z) * (on ? -1 : 1);
    const sw = this.model.components[o.name];
    sw.closed = o.on;
  }

  private reset() {
    this.model = structuredClone(emptyModel);
  }

  private addWire(pin0: string, pin1: string) {
    const wire = { pin0, pin1 };
    this.model.wires.push(wire);
    return wire;
  }

  private removeWire(wire: any) {
    const id = this.findWireId(wire);
    this.model.wires.splice(id, 1);
    const deadPool = this.wireList.filter(wv => wv.wire === wire);
    this.wireList = this.wireList.filter(wv => wv.wire !== wire);
    deadPool.forEach(w => w.dispose());
  }

  private findWireId(wire: any) {
    for (let i = 0; i < this.model.wires.length; i++) {
      const wi = this.model.wires[i];
      if (wi.pin0 === wire.pin0 && wi.pin1 === wire.pin1) {
        return i;
      }
    }
    return -1;
  }

  private getVisualNode(name: string) {
    return this.nodesByName[name];
  }

  private rebuildView() {
    this.wireList.forEach(w => w.dispose());
    this.wireList = [];

    for (const f in this.model.components) {
      const e = this.model.components[f];
      if (e.type === 'SWITCH') {
        this.setSwitch(this.nodesByName[f], e.closed);
      } else if (e.type === 'LED') {
        this.setGlow(f, false);
      }
    }

    this.model.wires.forEach(w => {
      if (w.hidden) return;
      const p0 = this.getVisualNode(w.pin0);
      const p1 = this.getVisualNode(w.pin1);
      const wireView = this.wiresService.createWire(p0.position, p1.position);
      wireView.pin0 = w.pin0;
      wireView.pin1 = w.pin1;
      wireView.wire = w;
      this.wireList.push(wireView);
    });
  }

  handleClick(object: THREE.Object3D, event: MouseEvent) {
    const ename = object.userData.elementName;
    const obj = this.scene.getObjectByName(ename);

    if (event.button === 0) {
      if (obj.name.startsWith('SWITCH')) {
        this.setSwitch(obj, !obj.on);
      }
      
      if (this.lastClicked) {
        this.lastClicked = undefined;
      } else {
        this.lastClicked = object.userData.elementName;
      }
    }

    if (event.button === 2) {
      const deadPool = this.model.wires.filter(wi => 
        ((wi.pin0 === ename) || (wi.pin1 === ename)) && (!wi.hidden)
      );
      deadPool.forEach(wi => this.removeWire(wi));
    }
  }

  handleDrag(object: THREE.Object3D, delta: THREE.Vector3, hilightedObject?: THREE.Object3D) {
    const name = object.userData.elementName;
    if (name.startsWith("PIN")) {
      const end = delta.clone().add(object.position);
      if (!this.dragWire) {
        this.dragWire = this.wiresService.createWire(object.position, end);
      } else {
        this.dragWire.end.copy(end);
        if (hilightedObject) {
          const obj = this.model.components[hilightedObject.userData.elementName];
          if (obj && obj.type === 'PIN') {
            this.dragWire.end.copy(hilightedObject.position);
          }
        }
        this.dragWire.needsUpdate = true;
      }
    }
  }

  handleDrop(object: THREE.Object3D, delta: THREE.Vector3, hilightedObject?: THREE.Object3D) {
    if (this.dragWire) {
      const isValidWire = (object !== hilightedObject) && 
        hilightedObject && 
        this.model.components[hilightedObject.userData.elementName]?.type === 'PIN';

      if (isValidWire) {
        this.dragWire.pin0 = object.userData.elementName;
        this.dragWire.pin1 = hilightedObject.userData.elementName;
        this.dragWire.setEnd(hilightedObject.position);
        this.dragWire.wire = this.addWire(this.dragWire.pin0, this.dragWire.pin1);
        this.wireList.push(this.dragWire);
      } else {
        this.dragWire.dispose();
      }
    }
    this.dragWire = undefined;
  }

  updateComponent = (k: string, c: Component, signal: number) => {
    if (c.type === 'LED') {
      this.setGlow(k, !!signal);
    }
  }
}