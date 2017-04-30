'use strict';

const width = 400;
const height = 300;

const socket = io();

//New scene and camera
const scene = new THREE.Scene();

//New Renderer
const renderers = [
  new THREE.WebGLRenderer({ alpha: true, canvas: document.getElementById('bottom') }),
  new THREE.WebGLRenderer({ alpha: true, canvas: document.getElementById('right') }),
  new THREE.WebGLRenderer({ alpha: true, canvas: document.getElementById('left') }),
];

const cameras = [
  new THREE.PerspectiveCamera(75, width / height, 0.5, 1000),
  new THREE.PerspectiveCamera(75, width / height, 0.5, 1000),
  new THREE.PerspectiveCamera(75, width / height, 0.5, 1000),
];

const cameraDistance = 18;

cameras[0].position.z += cameraDistance;
cameras[1].position.x -= cameraDistance;
cameras[2].position.x += cameraDistance;

//Add lighting
scene.add(new THREE.AmbientLight(0x333333));

const sun = new THREE.PointLight(0xFFFFFF, 1, 100);
sun.position.x = 12;
sun.position.y = 10;
sun.position.z = 10;
scene.add(sun);

const planet = new THREE.Group();

cameras.forEach((camera) => {
  camera.lookAt(planet.position);
});

{
  //Create a sphere to make visualization easier.
  const geometry = new THREE.SphereGeometry(10, 32, 32);
  const material = new THREE.MeshPhongMaterial({
    wireframe: false,
    map: THREE.ImageUtils.loadTexture('textures/earthmap1k.jpg'),
    bumpMap: THREE.ImageUtils.loadTexture('textures/earthbump1k.jpg'),
    bumpScale: 0.5,
    specularMap: THREE.ImageUtils.loadTexture('textures/earthspec1k.jpg'),
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.rotation.y += -1.57;
  planet.add(sphere);
}

{
  $.getJSON("./sample_data.json", function(data) {
    console.log(data.lat.length, data.lon.length);
    renderData(data);
    const canvas = document.getElementById('test');
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    // const texture = THREE.ImageUtils.loadTexture('textures/earthspec1k.jpg');
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.3,
    });
    const geometry = new THREE.SphereGeometry(10.3, 32, 32);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y += -1.57;  
    planet.add(mesh);
  });
}

//Draw the GeoJSON
const test_json = $.getJSON("test_geojson/custom.geo.json", function(data) {
  drawThreeGeo(data, 10, 'sphere', {
    color: 0x80FF80,
    transparent: true,
    opacity: 0.5,
  }, planet)
});

scene.add(planet);

const composers = renderers.map((renderer, index) => {
  const composer = new THREE.EffectComposer( renderer );
  composer.addPass( new THREE.RenderPass( scene, cameras[index]) );


  const glitchPass = new THREE.GlitchPass();

  composer.addPass( glitchPass );

  return composer;
});

function glitch(delay) {
  composers.forEach((composer) => {
    const glitchPass = composer.passes[1];

    if (!glitchPass.goWild) {
      glitchPass.renderToScreen = true;
      glitchPass.goWild = true;
      glitchPass.goSmooth = false;

      setTimeout(() => {
        glitchPass.goWild = false;
        glitchPass.goSmooth = true;
      }, delay);
    }
  });
}

let planetRotationY = 0;
let planetRotationX = 0;

//Render the image
function render() {
  planet.rotation.y += planetRotationY;
  planet.rotation.x += planetRotationX;
  composers.forEach((composer) => composer.render());
  requestAnimationFrame(render);
}

render();
glitch(3000);

socket.on('rotate_more', function(msg) {
  planetRotationY += 0.01;
});

socket.on('rotate_less', function(msg) {
  planetRotationY -= 0.01;
});

socket.on('rotate_up', function(msg) {
  planetRotationX += 0.01;
});

socket.on('rotate_down', function(msg) {
  planetRotationX -= 0.01;
});

socket.on('switch_heatmap', function(msg) {

});

socket.on('glitch_it', () => glitch(500));

socket.on('stop_rotation', function(msg) {
  if (planetRotationX || planetRotationY) {
    planetRotationY = 0;
    planetRotationX = 0;
  } else {
    planet.rotation.x = 0;
    planet.rotation.y = 0;
  }
});
