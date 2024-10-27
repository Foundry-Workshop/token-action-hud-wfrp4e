const constants = {
  modulePath: 'modules/token-action-hud-wfrp4e',
  moduleId: 'token-action-hud-wfrp4e',
  moduleLabel: `Token Action HUD WFRP4e`,
  requiredCoreModuleVersion: '2.0'
};

const defaults = {}

const flags = {}

const settings = {
  displayUnequipped: 'displayUnequipped',
  groupLores: 'groupLores',
  groupTrappings: 'groupTrappings',
  maxCharacters: 'maxCharacters',
  shiftRollMode: 'shiftRollMode',
  bypassDefault: 'bypassDefault',
  advantageDesc: 'showAdvantageDescription'
}

const tah = {
  /**
   * Action types
   */
  actions: {
    characteristic: 'tokenActionHud.wfrp4e.characteristic',
    condition: 'tokenActionHud.wfrp4e.condition',
    consumable: 'tokenActionHud.wfrp4e.consumable',
    manualEffect: 'tokenActionHud.wfrp4e.effect',
    testIndependentEffect: 'tokenAction.wfrp4e.effect',
    item: 'tokenActionHud.wfrp4e.item',
    scroll: 'tokenActionHud.wfrp4e.scroll',
    grimoire: 'tokenActionHud.wfrp4e.grimoire',
    trait: 'tokenActionHud.wfrp4e.trait',
    utility: 'tokenActionHud.utility',
    weapon: 'tokenActionHud.wfrp4e.weapon',
  },

  /**
   * Groups
   */
  groups: {
    ammunition: {id: 'ammunition', name: 'tokenActionHud.wfrp4e.ammunition', type: 'system'},
    armour: {id: 'armour', name: 'tokenActionHud.wfrp4e.armour', type: 'system'},
    character: {id: 'character', name: 'tokenActionHud.wfrp4e.character', type: 'system'},
    characteristics: {id: 'characteristics', name: 'tokenActionHud.wfrp4e.characteristics', type: 'system'},
    combat: {id: 'combat', name: 'tokenActionHud.wfrp4e.combat', type: 'system'},
    combatArmour: {id: 'combatArmour', name: 'tokenActionHud.wfrp4e.armour', type: 'system'},
    combatBasic: {id: 'combatBasic', name: 'tokenActionHud.wfrp4e.basic', type: 'system'},
    combatTraits: {id: 'combatTraits', name: 'tokenActionHud.wfrp4e.traits', type: 'system'},
    combatAdvantage: {id: 'combatAdvantage', name: 'tokenActionHud.wfrp4e.advantage', type: 'system'},
    combatWeapons: {id: 'combatWeapons', name: 'tokenActionHud.wfrp4e.weapons', type: 'system'},
    conditions: {id: 'conditions', name: 'tokenActionHud.wfrp4e.conditions', type: 'system'},
    consumables: {id: 'consumables', name: 'tokenActionHud.wfrp4e.consumables', type: 'system'},
    containers: {id: 'containers', name: 'tokenActionHud.wfrp4e.containers', type: 'system'},
    extendedTests: {id: 'extendedTests', name: 'tokenActionHud.wfrp4e.extendedTests', type: 'system'},
    grimoires: {id: 'grimoires', name: 'tokenActionHud.wfrp4e.grimoires', type: 'system'},
    manualEffects: {id: 'manualEffects', name: 'tokenActionHud.wfrp4e.manualEffects', type: 'system'},
    testIndependentEffects: {id: 'testIndependentEffects', name: 'tokenActionHud.wfrp4e.testIndependentEffects', type: 'system'},
    prayersBlessings: {id: 'prayersBlessings', name: 'tokenActionHud.wfrp4e.prayersBlessings', type: 'system'},
    prayersMiracles: {id: 'prayersMiracles', name: 'tokenActionHud.wfrp4e.prayersMiracles', type: 'system'},
    scrolls: {id: 'scrolls', name: 'tokenActionHud.wfrp4e.scrolls', type: 'system'},
    skillsAdvanced: {id: 'skillsAdvanced', name: 'tokenActionHud.wfrp4e.skillsAdvanced', type: 'system'},
    skillsBasic: {id: 'skillsBasic', name: 'tokenActionHud.wfrp4e.skillsBasic', type: 'system'},
    spellsArcane: {id: 'spellsArcane', name: 'tokenActionHud.wfrp4e.spellsArcane', type: 'system'},
    spellsPetty: {id: 'spellsPetty', name: 'tokenActionHud.wfrp4e.spellsPetty', type: 'system'},
    talents: {id: 'talents', name: 'tokenActionHud.wfrp4e.talents', type: 'system'},
    token: {id: 'token', name: 'tokenActionHud.token', type: 'system'},
    traits: {id: 'traits', name: 'tokenActionHud.wfrp4e.traits', type: 'system'},
    trappings: {id: 'trappings', name: 'tokenActionHud.wfrp4e.trappings', type: 'system'},
    treasure: {id: 'treasure', name: 'tokenActionHud.wfrp4e.treasure', type: 'system'},
    utility: {id: 'utility', name: 'tokenActionHud.utility', type: 'system'},
    weapons: {id: 'weapons', name: 'tokenActionHud.wfrp4e.weapons', type: 'system'},
  },

  /**
   * Item types
   */
  items: {
    ammunition: {groupId: 'ammunition'},
    armour: {groupId: 'armour'},
    container: {groupId: 'containers'},
    blessing: {groupId: 'prayersBlessings'},
    effect: {groupId: 'manualEffects'},
    miracle: {groupId: 'prayersMiracles'},
    'forien-armoury.scroll': {groupId: 'scrolls'},
    'forien-armoury.grimoire': {groupId: 'grimoires'},
    skillAdvanced: {groupId: 'skillsAdvanced'},
    skillBasic: {groupId: 'skillsBasic'},
    spellArcane: {groupId: 'spellsArcane'},
    spellPetty: {groupId: 'spellsPetty'},
    talent: {groupId: 'talents'},
    trait: {groupId: 'traits'},
    trapping: {groupId: 'trappings'},
    weapon: {groupId: 'weapons'},
  }
}


export {constants, defaults, flags, settings, tah};
