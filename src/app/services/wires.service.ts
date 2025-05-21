import { Injectable } from '@angular/core';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

@Injectable({
  providedIn: 'root'
})
export class WiresService {
  private kulers = [
    '#1D5D9B', '#75C2F6', '#F4D160', '#FBEEAC',
    '#22A699', '#F2BE22', '#F29727', '#F24C3D'
  ];
  private materials: THREE.MeshStandardMaterial[] = [];
  private npath = 7;
  private nsegs = 6;
  private wireRadius = 0.015;
  private wireProfile: THREE.Shape;
  private scene: THREE.Scene;

  constructor() {
    this.initializeMaterials();
    this.createWireProfile();
  }

  initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  private initializeMaterials() {
    this.kulers.forEach(color => {
      this.materials.push(new THREE.MeshStandardMaterial({ color }));
    });
  }

  private createWireProfile() {
    this.wireProfile = new THREE.Shape();
    for (let i = 0; i <= this.nsegs; i++) {
      const t = i * Math.PI * 2 / this.nsegs;
      const sa = Math.sin(t) * this.wireRadius;
      const ca = Math.cos(t) * this.wireRadius;
      if (i) {
        this.wireProfile.lineTo(sa, ca);
      } else {
        this.wireProfile.moveTo(sa, ca);
      }
    }
  }

  createWire(start: THREE.Vector3, end: THREE.Vector3) {
    const randomPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= this.npath; i++) {
      const ppt = new THREE.Vector3();
      const th = i / this.npath;
      const randMag = 1 - (Math.abs(0.5 - th) * 2);
      
      const wiggle = 0.05;
      ppt.y += 0.1;
      ppt.x += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag);
      ppt.y += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag);
      ppt.z += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag);
      randomPoints.push(ppt);
    }

    let geometry2: THREE.ExtrudeGeometry;
    let mesh2: THREE.Mesh;

    const rebuildPath = (start: THREE.Vector3, end: THREE.Vector3) => {
      const pathPoints: THREE.Vector3[] = [];
      const pathLength = end.distanceTo(start);
      
      for (let i = 0; i <= this.npath; i++) {
        const th = i / this.npath;
        const arcScale = 0.3 * pathLength;
        const arcHeight = Math.cos((th * Math.PI) + (Math.PI * 0.5)) * arcScale;

        const ppt = new THREE.Vector3().copy(start).lerp(end, th);
        ppt.add(randomPoints[i]);
        ppt.y -= arcHeight;
        pathPoints.push(ppt);
      }

      const randomSpline = new THREE.CatmullRomCurve3(pathPoints);
      const extrudeSettings = {
        steps: 50,
        bevelEnabled: false,
        extrudePath: randomSpline
      };

      if (geometry2) geometry2.dispose();
      
      geometry2 = new THREE.ExtrudeGeometry(this.wireProfile, extrudeSettings);
      geometry2 = BufferGeometryUtils.mergeVertices(geometry2, 0.0001);
      geometry2 = BufferGeometryUtils.toCreasedNormals(geometry2, 3.0);

      if (!mesh2) {
        const materialIndex = Math.floor(Math.random() * this.materials.length);
        mesh2 = new THREE.Mesh(geometry2, this.materials[materialIndex]);
        this.scene.add(mesh2);
      } else {
        mesh2.geometry = geometry2;
      }
    };

    rebuildPath(start, end);

    return {
      dispose: () => {
        geometry2.dispose();
        mesh2 && mesh2.parent && mesh2.parent.remove(mesh2);
        mesh2 = undefined;
      },
      setEnd: (point: THREE.Vector3) => {
        end = point.clone();
        rebuildPath(start, end);
      }
    };
  }
}