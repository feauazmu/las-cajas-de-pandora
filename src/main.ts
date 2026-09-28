import "./style.css";
import { unlockAudioOnFirstGesture } from "./audio/context";
import { playMusic } from "./audio/music";
import { sfx } from "./audio/sfx";
import { es } from "./content/es";
import { STAGES } from "./game/defs";
import { createGame } from "./game/engine";
import { deserialize, SAVE_KEY, serialize } from "./game/save";
import { createInitialState } from "./game/state";
import { formatCroquetas } from "./format/number";
import { asset, pick } from "./ui/dom";
import { confirmReset, showMemo, showOffline } from "./ui/modals";
import { Scene } from "./ui/scene";
import { Store } from "./ui/store";

const AUTOSAVE_MS = 10_000;
const STORE_REFRESH_MS = 250;
const OFFLINE_POPUP_MIN_MS = 60_000;

const now = () => Date.now();

function readSave(): string | null {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

let isNewGame = false;
const state = deserialize(readSave(), () => {
  isNewGame = true;
  return createInitialState(now(), Math.random);
});
const game = createGame({ state, now, rng: Math.random });

let resetting = false;
function save(): void {
  if (resetting) return;
  try {
    localStorage.setItem(SAVE_KEY, serialize(game.state));
  } catch (error) {
    console.warn("Could not save the game.", error);
  }
}

const stageDef = () => STAGES[game.state.stage - 1]!;
const stageContent = () => es.stages[stageDef().id]!;

const scene = new Scene(game, {
  onReset: () =>
    confirmReset(() => {
      resetting = true;
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        // Nothing saved to clear.
      }
      location.reload();
    }),
});

const store = new Store(game, {
  onExpansion() {
    sfx.fanfare();
    scene.showStage();
    playMusic(asset(stageDef().assets.music));
    save();
    showMemo(stageContent().memo, () => scene.sayQuote());
  },
});

document.title = es.ui.title;
const app = document.querySelector<HTMLElement>("#app")!;
app.append(scene.root, store.root);
app.classList.add("layout");

unlockAudioOnFirstGesture();
playMusic(asset(stageDef().assets.music));

function offerOffline(report: { elapsedMs: number; gain: number }): void {
  if (report.gain <= 0) return;
  showOffline(es.ui.duration(report.elapsedMs), formatCroquetas(report.gain), pick(es.offlineLines));
}

if (isNewGame) {
  showMemo(stageContent().memo);
} else {
  offerOffline(game.applyOffline(now()));
}

let lastStoreRefresh = 0;
function frame(): void {
  const t = now();
  game.tick(t);
  scene.update(t);
  if (t - lastStoreRefresh >= STORE_REFRESH_MS) {
    lastStoreRefresh = t;
    store.update();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(save, AUTOSAVE_MS);
let hiddenAt: number | null = null;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    hiddenAt = now();
    save();
    return;
  }
  const report = game.applyOffline(now());
  if (hiddenAt !== null && now() - hiddenAt >= OFFLINE_POPUP_MIN_MS) offerOffline(report);
  hiddenAt = null;
});
window.addEventListener("pagehide", save);

