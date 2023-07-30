const constants = {
  modulePath: 'modules/token-action-hud-wfrp4e',
  moduleId: 'token-action-hud-wfrp4e',
  moduleLabel: `Token Action HUD WFRP4e`,
  requiredCoreModuleVersion: '1.4.16'
};

const defaults = {}

const flags = {}

const settings = {
  displayUnequipped: 'displayUnequipped'
}

const tah = {
  /**
   * Action types
   */
  actions: {
    item: 'tokenActionHud.template.item',
    utility: 'tokenActionHud.utility'
  },

  /**
   * Groups
   */
  groups: {
    armour: {id: 'armour', name: 'tokenActionHud.template.armor', type: 'system'},
    trapping: {id: 'trapping', name: 'tokenActionHud.template.trapping', type: 'system'},
    containers: {id: 'containers', name: 'tokenActionHud.template.containers', type: 'system'},
    treasure: {id: 'treasure', name: 'tokenActionHud.template.treasure', type: 'system'},
    weapons: {id: 'weapons', name: 'tokenActionHud.template.weapons', type: 'system'},
    combat: {id: 'combat', name: 'tokenActionHud.combat', type: 'system'},
    token: {id: 'token', name: 'tokenActionHud.token', type: 'system'},
    utility: {id: 'utility', name: 'tokenActionHud.utility', type: 'system'}
  },

  /**
   * Item types
   */
  items: {
    armour: {groupId: 'armour'},
    container: {groupId: 'containers'},
    trapping: {groupId: 'trapping'},
    weapon: {groupId: 'weapons'}
  }
}


export {constants, defaults, flags, settings, tah};
