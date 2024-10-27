import {DEFAULTS} from './defaults.mjs'
import {ActionHandlerWfrp4e} from "./ActionHandler.mjs";
import {RollHandlerWfrp4e} from "./RollHandler.mjs";
import {registerSettingsCoreUpdate} from "./settings.mjs";
import {constants} from "./constants.mjs";

export let SystemManagerWfrp4e = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {

  /**
   * Extends Token Action HUD Core's SystemManager class
   * @extends SystemManager
   */
  SystemManagerWfrp4e = class SystemManagerWfrp4e extends coreModule.api.SystemManager {
    /**
     * Returns an instance of the ActionHandler to Token Action HUD Core
     * Called by Token Action HUD Core
     * @override
     * @returns {ActionHandler} The ActionHandler instance
     */
    getActionHandler () {
      return new ActionHandlerWfrp4e();
    }

    /**
     * Returns a list of roll handlers to Token Action HUD Core
     * Used to populate the Roll Handler module setting choices
     * Called by Token Action HUD Core
     * @override
     * @returns {object} The available roll handlers
     */
    getAvailableRollHandlers () {
      const coreTitle = 'WFRP4e';

      return {core: coreTitle};
    }

    /**
     * Returns an instance of the RollHandler to Token Action HUD Core
     * Called by Token Action HUD Core
     * @override
     * @param {string} rollHandlerId The roll handler ID
     * @returns {rollHandler}        The RollHandler instance
     */
    getRollHandler (rollHandlerId) {
      let rollHandler;

      switch (rollHandlerId) {
        case 'wfrp4e':
        default:
          rollHandler = new RollHandlerWfrp4e();
          break;
      }

      return rollHandler;
    }

    /**
     * Register Token Action HUD system module settings
     * Called by Token Action HUD Core
     * @override
     * @param {function} coreUpdate The Token Action HUD Core update function
     */
    registerSettings (coreUpdate) {
      registerSettingsCoreUpdate(coreUpdate);
    }

    /**
     * Returns the default layout and groups to Token Action HUD Core
     * Called by Token Action HUD Core
     * @returns {object} The default layout and groups
     */
    async registerDefaults () {
      return DEFAULTS;
    }

    /**
     * @todo should be async, but async leads to errors
     *
     * @returns {{darkRed: {file: string, name: string, primaryColor: string, moduleId: string, class: string, tertiaryColor: string, secondaryColor: string}, brown: {file: string, name: string, primaryColor: string, moduleId: string, class: string, tertiaryColor: string, secondaryColor: string}}}
     */
    registerStyles() {
      return {
        darkRed: {
          class: "tah-style-wfrp4e-dark-red",
          file: "wfrp4e-dark-red",
          moduleId: constants.moduleId,
          name: "WFRP4e Dark Red",
          primaryColor: "#dddddd",
          secondaryColor: "#dddddd80",
          tertiaryColor: "#ff6400"
        },
        brown: {
          class: "tah-style-wfrp4e-brown",
          file: "wfrp4e-brown",
          moduleId: constants.moduleId,
          name: "WFRP4e Brown",
          primaryColor: "#dddddd",
          secondaryColor: "#dddddd80",
          tertiaryColor: "#ff6400"
        }
      }
    }
  }
})