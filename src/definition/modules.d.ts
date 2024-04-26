import {AssetsManager} from "../modules/assetsManager.ts";
import {PauseDetector} from "../modules/pauseDetector.ts";
import {SceneManager} from "../modules/sceneManager.ts";

interface Modules {
    sceneManager: SceneManager
    assetsManager: AssetsManager
    pauseDetector: PauseDetector
}