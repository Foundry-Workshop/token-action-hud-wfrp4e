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
    characteristic: 'tokenActionHud.wfrp4e.characteristic',
    item: 'tokenActionHud.wfrp4e.item',
    utility: 'tokenActionHud.utility'
  },

  /**
   * Groups
   */
  groups: {
    characteristics: {id: 'characteristics', name: 'tokenActionHud.wfrp4e.characteristics', type: 'system'},
    armour: {id: 'armour', name: 'tokenActionHud.wfrp4e.armour', type: 'system'},
    skillsBasic: {id: 'skillsBasic', name: 'tokenActionHud.wfrp4e.skillsBasic', type: 'system'},
    skillsAdvanced: {id: 'skillsAdvanced', name: 'tokenActionHud.wfrp4e.skillsAdvanced', type: 'system'},
    trappings: {id: 'trappings', name: 'tokenActionHud.wfrp4e.trappings', type: 'system'},
    consumables: {id: 'consumables', name: 'tokenActionHud.wfrp4e.consumables', type: 'system'},
    containers: {id: 'containers', name: 'tokenActionHud.wfrp4e.containers', type: 'system'},
    treasure: {id: 'treasure', name: 'tokenActionHud.wfrp4e.treasure', type: 'system'},
    weapons: {id: 'weapons', name: 'tokenActionHud.wfrp4e.weapons', type: 'system'},
    spellsArcane: {id: 'spellsArcane', name: 'tokenActionHud.wfrp4e.spellsArcane', type: 'system'},
    spellsPetty: {id: 'spellsPetty', name: 'tokenActionHud.wfrp4e.spellsPetty', type: 'system'},
    prayers: {id: 'prayers', name: 'tokenActionHud.wfrp4e.prayers', type: 'system'},
    talents: {id: 'talents', name: 'tokenActionHud.wfrp4e.talents', type: 'system'},
    traits: {id: 'traits', name: 'tokenActionHud.wfrp4e.traits', type: 'system'},
    combat: {id: 'combat', name: 'tokenActionHud.wfrp4e.combat', type: 'system'},
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
    weapon: {groupId: 'weapons'},
    skillBasic: {groupId: 'skillsBasic'},
    skillAdvanced: {groupId: 'skillsAdvanced'},
    talent: {groupId: 'talents'},
    trait: {groupId: 'traits'},
    spellPetty: {groupId: 'spellsPetty'},
    spellArcane: {groupId: 'spellsArcane'},
    prayer: {groupId: 'prayers'}
  }
}


export {constants, defaults, flags, settings, tah};
