import { Application, Graphics } from "pixi.js";
import { TraumaShakeContainer, ShakeSettings } from "./TraumaShakeContainer";
import * as dat from "dat.gui";

// Create PixiJS application
const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x104488,
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

app.stage.addChild(grid);

// Create shake container and test square
const shakeContainer = new TraumaShakeContainer();
const square = new Graphics();
square.beginFill(0xdd2222);
const w = 50;
const h = 50;
square.drawRect(-w / 2, -h / 2, w, h);
square.endFill();

shakeContainer.addChild(square);
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
  decayPerSecond: 0,
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
shakeFolder
  .add(controls, "decayPerSecond", 0, 2)
  .onChange((value: number) => {
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
  shakeContainer.update(delta / 60); // Convert to seconds

  // Update trauma monitor
  (traumaMonitor.object as { trauma: number }).trauma = shakeContainer.getTrauma();
});

// Optional: Add keyboard controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    controls.addTrauma();
  }
});
