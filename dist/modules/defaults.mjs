import {tah} from './constants.mjs'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('setup', () => {
  const groups = tah.groups

  Object.values(groups).forEach(group => {
    group.name = game.i18n.localize(group.name)
    group.listName = `Group: ${game.i18n.localize(group.listName ?? group.name)}`
  })

  const groupsArray = Object.values(groups)

  DEFAULTS = {
    layout: [
      {
        nestId: 'characteristics',
        id: 'categoryCharacteristics',
        name: game.i18n.localize('tokenActionHud.wfrp4e.characteristics'),
        groups: [
          {...groups.characteristics, nestId: 'categoryCharacteristics_characteristics'},
        ]
      },
      {
        nestId: 'skills',
        id: 'categorySkills',
        name: game.i18n.localize('tokenActionHud.wfrp4e.skills'),
        groups: [
          {...groups.skillsBasic, nestId: 'categorySkills_skillsBasic'},
          {...groups.skillsAdvanced, nestId: 'categorySkills_skillsAdvanced'},
        ]
      },
      {
        nestId: 'talents',
        id: 'categoryTalents',
        name: game.i18n.localize('tokenActionHud.wfrp4e.talents'),
        groups: [
          {...groups.talents, nestId: 'categoryTalents_talents'},
          {...groups.traits, nestId: 'categoryTalents_traits'},
        ]
      },
      {
        nestId: 'combat',
        id: 'categoryCombat',
        name: game.i18n.localize('tokenActionHud.wfrp4e.combat'),
        groups: [
          {...groups.weapons, nestId: 'categoryCombat_weapons'},
          {...groups.consumables, nestId: 'categoryCombat_consumables'},
        ]
      },
      {
        nestId: 'magic',
        id: 'categoryMagic',
        name: game.i18n.localize('tokenActionHud.wfrp4e.magic'),
        groups: [
          {...groups.spellsPetty, nestId: 'categoryMagic_spellsPetty'},
          {...groups.spellsArcane, nestId: 'categoryMagic_spellsArcane'},
          {...groups.prayers, nestId: 'categoryMagic_prayers'},
        ]
      },
      {
        nestId: 'inventory',
        id: 'categoryInventory',
        name: game.i18n.localize('tokenActionHud.wfrp4e.inventory'),
        groups: [
          {...groups.weapons, nestId: 'categoryInventory_weapons'},
          {...groups.armour, nestId: 'categoryInventory_armour'},
          {...groups.containers, nestId: 'categoryInventory_containers'},
          {...groups.trappings, nestId: 'categoryInventory_trapping'}
        ]
      },
      {
        nestId: 'utility',
        id: 'categoryUtility',
        name: game.i18n.localize('tokenActionHud.utility'),
        groups: [
          {...groups.combat, nestId: 'categoryUtility_combat'},
          {...groups.token, nestId: 'categoryUtility_token'},
          {...groups.rests, nestId: 'categoryUtility_rests'},
          {...groups.utility, nestId: 'categoryUtility_utility'}
        ]
      }
    ],
    groups: groupsArray
  }
});