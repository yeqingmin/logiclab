import*as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js"

let kulers = `#F39189
#BB8082
#6E7582
#046582
#9FC088
#E8C07D
#CC704B
#614124`.split('\n')

let {sin, cos, abs, max, min, PI} = Math;
let rnd = (rng)=>(Math.random() * rng)
let irnd = (rng)=>((Math.random() * rng) | 0)
export default function Wires({THREE, scene}) {
    const mkMat = (color=0xff0000)=>new THREE.MeshStandardMaterial({
        color,
        //: 0xff8000,
        //wireframe:true,
    });

    let materials = []
    kulers.forEach(k=>materials.push(mkMat(k)))
    let npath = 7;
    let nsegs = 6;
    let wireRadius = .015
    const wireProfile = new THREE.Shape();
    for (let i = 0; i <= nsegs; i++) {
        let t = i * PI * 2 / nsegs;
        let sa = sin(t) * wireRadius;
        let ca = cos(t) * wireRadius;
        if (i)
            wireProfile.lineTo(sa, ca)
        else
            wireProfile.moveTo(sa, ca)
    }
    function Wire(start, end) {
        this.start = start.clone();
        this.end = end.clone();
        let geometry2;
        const randomPoints = [];

        for (let i = 0; i <= npath; i++) {
            let ppt = new THREE.Vector3();
            let th = i / npath;
            let randMag = 1-(abs(.5 - th) * 2);
            
            let wiggle = .05;
            ppt.y += .1;
            ppt.x += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag)
            ppt.y += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag)
            ppt.z += (THREE.MathUtils.randFloat(-wiggle, wiggle) * randMag)
            randomPoints.push(ppt)
        }
        let mesh2;
        let rebuildPath = (start,end)=>{
            let pathPoints = []
            let pathLength = end.distanceTo(start);
            for (let i = 0; i <= npath; i++) {
                let th = i / npath;

                let arcScale = .3 * pathLength
                let arcHeight = cos((th * PI) + (PI * .5)) * arcScale;

                let ppt = new THREE.Vector3();
                ppt.copy(start).lerp(end, th);

                ppt.add(randomPoints[i]);
                ppt.y -= arcHeight;
                pathPoints.push(ppt);

                if(0)
                if ((i == 0) || (i == npath)) {
                    let p = ppt.clone();
                    p.y -= 0.1;
                    pathPoints.push(p);
                    if (i == 0) {
                        let swp = pathPoints[0];
                        pathPoints[0] = pathPoints[1];
                        pathPoints[1] = swp;
                    }
                }
            }

            const randomSpline = new THREE.CatmullRomCurve3(pathPoints);
            const extrudeSettings = {
                steps: 50,
                bevelEnabled: false,
                extrudePath: randomSpline
            };
            if (geometry2)
                geometry2.dispose();
            geometry2 = new THREE.ExtrudeGeometry(wireProfile,extrudeSettings);

            geometry2 = BufferGeometryUtils.mergeVertices(geometry2, .0001);
            //geometry2.computeVertexNormals();
            geometry2 = BufferGeometryUtils.toCreasedNormals(geometry2, 3.);
            if (!mesh2) {
                mesh2 = new THREE.Mesh(geometry2,materials[irnd(materials.length)]);
                scene.add(mesh2);
            } else
                mesh2.geometry = geometry2
        }
        rebuildPath(start, end)
        this.dispose = ()=>{
            geometry2.dispose();
            mesh2 && mesh2.parent && mesh2.parent.remove(mesh2);
            mesh2 = undefined;
        }
        this.setEnd = (point)=>{
            end = point.clone();
            rebuildPath(start, end)
        }

    }
    this.Wire = Wire;
}
