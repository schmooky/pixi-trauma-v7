import { Application, Assets, Filter, Graphics, Sprite } from "pixi.js";
import { TraumaShakeContainer, ShakeSettings } from "@pixi-trauma/v7";
import { DropShadowFilter } from "pixi-filters";
import * as dat from "dat.gui";

// Create PixiJS application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x101010,
  antialias: true,
  view: document.getElementById("pixiCanvas")! as HTMLCanvasElement,
});

// Create grid background
const grid = new Graphics();
const gridSize = 50;
grid.lineStyle(1, 0xcccccc, 0.5);

for (let x = 4; x <= app.screen.width; x += gridSize) {
  grid.moveTo(x, 0);
  grid.lineTo(x, app.screen.height);
}

for (let y = 4; y <= app.screen.height; y += gridSize) {
  grid.moveTo(0, y);
  grid.lineTo(app.screen.width, y);
}

// app.stage.addChild(grid);

// Function to load the background image
const loadBackgroundImage = async (file: File) => {
  const reader = new FileReader();

  reader.onload = async (event) => {
    const imgUrl = event.target?.result;

    if (typeof imgUrl === "string") {
      // Load the image using Assets.load
      const texture = await Assets.load(imgUrl);
      const sprite = new Sprite(texture);
      sprite.width = app.screen.width;
      sprite.height = app.screen.height;
      sprite.anchor.set(0.5);
      sprite.position.set(app.screen.width / 2, app.screen.height / 2);
      app.stage.addChildAt(sprite, 0);
    }
  };

  reader.readAsDataURL(file);
};

// Add event listener to the button
document.getElementById("loadBGInput")?.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*"; // Accept only image files

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      loadBackgroundImage(file);
    }
  };

  input.click();
});

// Create shake container and test square
const shakeContainer = new TraumaShakeContainer();
const square = new Graphics();
square.beginFill(0xffffff);
const w = 50;
const h = 50;
square.drawRect(-w / 2, -h / 2, w, h);
square.endFill();

shakeContainer.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(shakeContainer);

// GUI Controls setup
interface GuiControls extends ShakeSettings {
  addTrauma: () => void;
  traumaAmount: number;
  applyCustomTrauma: () => void;
}

const controls: GuiControls = {
  amplitude: 100,
  traumaPower: 2,
  decayPerSecond: 0.4,
  frequency: 15,
  octaves: 1,
  traumaAmount: 0.5,
  addTrauma: () => {
    shakeContainer.addTrauma(0.5);
  },
  applyCustomTrauma: () => {
    shakeContainer.addTrauma(controls.traumaAmount);
  },
};

// Setup dat.GUI
const gui = new dat.GUI();

// Shake parameters folder
const shakeFolder = gui.addFolder("Shake Parameters");
shakeFolder.add(controls, "amplitude", 0, 200).onChange((value: number) => {
  shakeContainer.updateSettings({ amplitude: value });
});
shakeFolder.add(controls, "traumaPower", 1, 5).onChange((value: number) => {
  shakeContainer.updateSettings({ traumaPower: value });
});
shakeFolder.add(controls, "decayPerSecond", 0, 2).onChange((value: number) => {
  shakeContainer.updateSettings({ decayPerSecond: value });
});
shakeFolder.add(controls, "frequency", 1, 30).onChange((value: number) => {
  shakeContainer.updateSettings({ frequency: value });
});
shakeFolder.add(controls, "octaves", 1, 4, 1).onChange((value: number) => {
  shakeContainer.updateSettings({ octaves: value });
});
shakeFolder.open();

var params = {
  loadFile: function () {
    document.getElementById("loadBGInput")!.click();
  },
};
gui.add(params, "loadFile").name("Change BG Image");

// Trauma controls folder
const traumaFolder = gui.addFolder("Trauma Controls");
traumaFolder.add(controls, "addTrauma").name("Add Fixed Trauma (0.5)");
traumaFolder.add(controls, "traumaAmount", 0, 1).name("Custom Trauma Amount");
traumaFolder.add(controls, "applyCustomTrauma").name("Apply Custom Trauma");
traumaFolder.open();

// Add trauma monitor
const traumaMonitor: dat.GUIController<{ trauma: number }> = gui
  .add({ trauma: 0 }, "trauma", 0, 1)
  .listen();

traumaMonitor.domElement.style.pointerEvents = "none";

// Animation loop
app.ticker.add((delta) => {
  shakeContainer.update(delta / 60); // Convert to seconds

  // Update trauma monitor
  (traumaMonitor.object as { trauma: number }).trauma =
    shakeContainer.getTrauma();
});

// Optional: Add keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    controls.addTrauma();
  }
});

const vertexShader = `
attribute vec2 aVertexPosition;  // Vertex position
attribute vec2 aTextureCoord;     // Texture coordinates

uniform mat3 projectionMatrix;    // Projection matrix

varying vec2 vTextureCoord;       // Varying for fragment shader

void main(void)
{
    // Transforming the vertex position using the projection matrix
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;  // Passing texture coordinates to fragment shader
}
`;

const fragmentShader = `
    varying vec2 vTextureCoord;   // Texture coordinates passed from vertex shader
varying vec4 vColor;          // Color variation (if necessary, though not directly used here)

uniform sampler2D uSampler;          // Texture sampler
uniform float outerStrength;          // Strength of the outer glow
uniform float innerStrength;          // Strength of the inner glow
uniform vec4 glowColor;               // Color of the glow
uniform vec4 filterArea;              // Area for filtering
uniform vec4 filterClamp;             // Clamping values
uniform bool knockout;                 // Whether to use knockout effect
uniform float alpha;                  // Alpha transparency for the glow

const float PI = 3.14159265358979323846264;  // Pi constant
const float DIST = 10.0;                    // Distance for glow, adjustable
const float ANGLE_STEP_SIZE = 0.2;          // Step size around the angle
const float ANGLE_STEP_NUM = ceil(PI * 2.0 / ANGLE_STEP_SIZE);  // Number of steps in a full circle

const float MAX_TOTAL_ALPHA = ANGLE_STEP_NUM * DIST * (DIST + 1.0) / 2.0;  // Maximum accumulated alpha

void main(void)
{
    vec2 px = vec2(1.0 / filterArea.x, 1.0 / filterArea.y);  // Pixel size for sampling
    float totalAlpha = 0.0;  // Accumulator for total alpha

    // Variables used for glow calculations
    vec2 direction;
    vec2 displaced;
    vec4 curColor;

    // Loop over angles to create an outer glow effect
    for (float angle = 0.0; angle < PI * 2.0; angle += ANGLE_STEP_SIZE) {
       direction = vec2(cos(angle), sin(angle)) * px;  // Calculate direction based on angle

       for (float curDistance = 0.0; curDistance < DIST; curDistance++) {
           displaced = clamp(vTextureCoord + direction * (curDistance + 1.0), filterClamp.xy, filterClamp.zw);
           curColor = texture2D(uSampler, displaced);  // Sample the texture at the displaced coordinates
           totalAlpha += (DIST - curDistance) * curColor.a;  // Accumulate total alpha
       }
    }
    
    curColor = texture2D(uSampler, vTextureCoord);  // Sample the current color

    // Calculate the alpha ratio based on total alpha
    float alphaRatio = (totalAlpha / MAX_TOTAL_ALPHA);
    float innerGlowAlpha = (1.0 - alphaRatio) * innerStrength * curColor.a;
    float innerGlowStrength = min(1.0, innerGlowAlpha);
    
    vec4 innerColor = mix(curColor, glowColor, innerGlowStrength);  // Mix current color with glow color

    // Calculate the outer glow
    float outerGlowAlpha = alphaRatio * outerStrength * (1. - curColor.a);
    float outerGlowStrength = min(1.0 - innerColor.a, outerGlowAlpha);

    float resultAlpha = 1.0;
    gl_FragColor = vec4(glowColor.rgb * resultAlpha, resultAlpha);
}
`;

const glowFilter = new Filter(vertexShader, fragmentShader, {
  radius: 10.0, // Glow radius
  glowColor: [1.0, 0.5, 0.0, 1.0], // RGBA color,
  outerStrength: 10
});

// app.ticker.add(() => {
//   glowFilter.uniforms.radius = Math.sin(app.ticker.lastTime * 0.001) * 50 + 100; // Example animating radius
// });

// Create a sprite from the rectangle graphic
const rectangleTexture = app.renderer.generateTexture(square);
const sprite = new Sprite(rectangleTexture);


// Apply the glow filter to the sprite
sprite.filters = [glowFilter];



shakeContainer.addChild(sprite);

console.log(sprite)