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

Hooks.on('tokenActionHudCoreActionContextMenu', (items, hudManager) => {
  const getAction = target => hudManager.actionHandler.availableActions?.get(target.dataset.actionId)

  const itemTypes = new Set(['combatWeapon', 'combatTrait', 'extendedTest', 'consumable', 'item', 'magic', 'skill', 'talent'])
  const effectTypes = new Set(['testIndependentEffect', 'manualEffect'])

  items.push({
    label: game.i18n.localize('tokenActionHud.wfrp4e.context.openSheet'),
    icon: "<i class='fa-solid fa-scroll'></i>",
    visible: target => itemTypes.has(getAction(target)?.system?.actionType),
    onClick: (event, target) => {
      hudManager.actor.items.get(target.dataset.actionId)?.sheet.render(true)
    }
  })

  items.push({
    label: game.i18n.localize('tokenActionHud.wfrp4e.context.openParentSheet'),
    icon: "<i class='fa-solid fa-scroll'></i>",
    visible: target => effectTypes.has(getAction(target)?.system?.actionType),
    onClick: async (event, target) => {
      const effectUuid = getAction(target)?.system?.effectUuid
      if (!effectUuid) return
      const effect = await fromUuid(effectUuid)
      effect?.parent?.sheet.render(true)
    }
  })
})

Hooks.on("wfrp4e:opposedTestResult", GroupAdvantage.opposedTestResult.bind(GroupAdvantage))

Handlebars.registerHelper({
  "tahw-icon": (name, options) => `<img class="token-action-hud-wfrp4e input-icon ${name.includes("mouse") ? "mouse" : ""}" src="${constants.modulePath}/assets/input-icons/${name}.svg" alt="${options.hash.alt}">`,
});