import "./style.css";
import { unlockAudioOnFirstGesture } from "./audio/context";
import { playMusic } from "./audio/music";
import { sfx } from "./audio/sfx";
import { es } from "./content/es";
import { MAX_TICK_MS } from "./game/defs";
import { createGame, type OfflineReport } from "./game/engine";
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

const stageContent = () => es.stages[game.currentStage().id]!;

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
    playMusic(asset(game.currentStage().assets.music));
    save();
    showMemo(stageContent().memo, () => scene.sayQuote());
  },
});

document.title = es.ui.title;
const app = document.querySelector<HTMLElement>("#app")!;
app.append(scene.root, store.root);
app.classList.add("layout");

unlockAudioOnFirstGesture();
playMusic(asset(game.currentStage().assets.music));

function offerOffline(report: OfflineReport): void {
  if (report.gain <= 0) return;
  showOffline(es.ui.duration(report.elapsedMs), formatCroquetas(report.gain), pick(es.offlineLines));
}

if (isNewGame) {
  showMemo(stageContent().memo);
} else {
  offerOffline(game.applyOffline(now()));
}

/**
 * Credits a gap longer than one tick (tab hidden, throttled or suspended)
 * through the offline path, whichever of the next frame or the
 * visibilitychange event notices it first.
 */
function catchUp(t: number): void {
  const report = game.applyOffline(t);
  if (report.elapsedMs >= OFFLINE_POPUP_MIN_MS) offerOffline(report);
}

let lastStoreRefresh = 0;
function frame(): void {
  const t = now();
  if (t - game.state.lastSavedAt > MAX_TICK_MS) catchUp(t);
  else game.tick(t);
  scene.update(t);
  if (t - lastStoreRefresh >= STORE_REFRESH_MS) {
    lastStoreRefresh = t;
    store.update();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

setInterval(save, AUTOSAVE_MS);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") save();
  else catchUp(now());
});
window.addEventListener("pagehide", save);

