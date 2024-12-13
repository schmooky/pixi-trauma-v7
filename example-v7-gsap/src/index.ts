import { Application, Assets, Filter, Graphics, Sprite } from "pixi.js";
import { TraumaShakeContainer, ShakeSettings } from "@pixi-trauma/v7";
import { DropShadowFilter } from "pixi-filters";
import * as dat from "dat.gui";

// Create PixiJS application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1e1e1d,
  antialias: true,
  view: document.getElementById("pixiCanvas")! as HTMLCanvasElement,
  resizeTo: document.body
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

app.stage.position.set(app.screen.width / 2, app.screen.height / 2)
document.addEventListener('resize', ()=> {
  
app.stage.position.set(app.screen.width / 2, app.screen.height / 2)
})

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


// GUI Controls setup
interface GuiControls extends ShakeSettings {
  addTrauma: () => void;
  traumaAmount: number;
  applyCustomTrauma: () => void;
}

const controls: GuiControls = {
  amplitude: 100,
  traumaPower: 2,
  decayPerSecond: 0.94,
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
  shakeContainer.update(delta);

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

// Create shake container and test square
const shakeContainer = new TraumaShakeContainer();
app.stage.addChild(shakeContainer);


const square = new Graphics();
square.beginFill(0xFF6D00);
const w = 50;
const h = 50;
square.drawRect(-w / 2, -h / 2, w, h);
square.endFill();
shakeContainer.addChild(square);