import {constants} from './constants.mjs';
import Utility from './utility/Utility.mjs';
import {SystemManagerWfrp4e} from "./SystemManager.mjs";
import GroupAdvantage from "./GroupAdvantage.js";
import Help from "./apps/Help.mjs";

Hooks.once('init', () => {
  Hooks.callAll(`${constants.moduleId}:afterInit`);
});

Hooks.once('setup', () => {
  Hooks.callAll(`${constants.moduleId}:afterSetup`);
});

Hooks.once('ready', () => {
  Hooks.callAll(`${constants.moduleId}:afterReady`);
  Utility.notify(`${constants.moduleLabel} ready`, {consoleOnly: true});
});

Hooks.on('tokenActionHudCoreApiReady', async () => {
  /**
   * Return the SystemManager and requiredCoreModuleVersion to Token Action HUD Core
   */
  const module = game.modules.get(constants.moduleId)
  module.api = {
    requiredCoreModuleVersion: constants.requiredCoreModuleVersion,
    SystemManager: SystemManagerWfrp4e
  }
  Hooks.call('tokenActionHudSystemReady', module)
  Utility.notify(`${constants.moduleLabel} connected to TAH Core`, {consoleOnly: true});
})

Hooks.on("wfrp4e:opposedTestResult", GroupAdvantage.opposedTestResult.bind(GroupAdvantage))

Handlebars.registerHelper({
  "tahw-icon": (name, options) => `<img class="token-action-hud-wfrp4e input-icon ${name.includes("mouse") ? "mouse" : ""}" src="${constants.modulePath}/assets/input-icons/${name}.svg" alt="${options.hash.alt}">`,
});