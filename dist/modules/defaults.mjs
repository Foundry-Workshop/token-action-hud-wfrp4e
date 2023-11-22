import {tah} from './constants.mjs'

/**
 * Default layout and groups
 */
export let DEFAULTS = null

Hooks.once('i18nInit', () => {
  const groups = tah.groups

  Object.values(groups).forEach(group => {
    group.name = game.i18n.localize(group.name)
    group.listName = `Group: ${game.i18n.localize(group.listName ?? group.name)}`
  })

  const groupsArray = Object.values(groups)

  DEFAULTS = {
    layout: [
      {
        nestId: 'categoryCharacteristics',
        id: 'categoryCharacteristics',
        name: game.i18n.localize('tokenActionHud.wfrp4e.character'),
        groups: [
          {...groups.characteristics, nestId: 'categoryCharacteristics_characteristics'},
        ]
      },
      {
        nestId: 'categorySkills',
        id: 'categorySkills',
        name: game.i18n.localize('tokenActionHud.wfrp4e.skills'),
        groups: [
          {...groups.extendedTests, nestId: 'categorySkills_extendedTests'},
          {...groups.skillsBasic, nestId: 'categorySkills_skillsBasic'},
          {...groups.skillsAdvanced, nestId: 'categorySkills_skillsAdvanced'},
        ]
      },
      {
        nestId: 'categoryTalents',
        id: 'categoryTalents',
        name: game.i18n.localize('tokenActionHud.wfrp4e.talents'),
        groups: [
          {...groups.talents, nestId: 'categoryTalents_talents'},
          {...groups.traits, nestId: 'categoryTalents_traits'},
        ]
      },
      {
        nestId: 'categoryCombat',
        id: 'categoryCombat',
        name: game.i18n.localize('tokenActionHud.wfrp4e.combat'),
        groups: [
          {...groups.combatBasic, nestId: 'categoryCombat_combatBasic'},
          {...groups.combatWeapons, nestId: 'categoryCombat_combatWeapons'},
          {...groups.combatTraits, nestId: 'categoryCombat_combatTraits'},
          {...groups.consumables, nestId: 'categoryCombat_consumables'},
          {...groups.combatArmour, nestId: 'categoryCombat_combatArmour'},
        ]
      },
      {
        nestId: 'categoryConditions',
        id: 'categoryConditions',
        name: game.i18n.localize('tokenActionHud.wfrp4e.conditions'),
        groups: [
          {...groups.conditions, nestId: 'categoryConditions_conditions'},
        ]
      },
      {
        nestId: 'categoryMagic',
        id: 'categoryMagic',
        name: game.i18n.localize('tokenActionHud.wfrp4e.magic'),
        groups: [
          {...groups.spellsPetty, nestId: 'categoryMagic_spellsPetty'},
          {...groups.spellsArcane, nestId: 'categoryMagic_spellsArcane'},
          {...groups.prayersBlessings, nestId: 'categoryMagic_prayersBlessings'},
          {...groups.prayersMiracles, nestId: 'categoryMagic_prayersMiracles'},
        ]
      },
      {
        nestId: 'categoryInventory',
        id: 'categoryInventory',
        name: game.i18n.localize('tokenActionHud.wfrp4e.inventory'),
        groups: [
          {...groups.weapons, nestId: 'categoryInventory_weapons'},
          {...groups.armour, nestId: 'categoryInventory_armour'},
          {...groups.ammunition, nestId: 'categoryInventory_ammunition'},
          {...groups.trappings, nestId: 'categoryInventory_trapping'},
          {...groups.containers, nestId: 'categoryInventory_containers'},
        ]
      },
      {
        nestId: 'categoryUtility',
        id: 'categoryUtility',
        name: game.i18n.localize('tokenActionHud.utility'),
        groups: [
          {...groups.combat, nestId: 'categoryUtility_combat'},
          {...groups.token, nestId: 'categoryUtility_token'},
          {...groups.character, nestId: 'categoryUtility_character'},
          {...groups.utility, nestId: 'categoryUtility_utility'}
        ]
      }
    ],
    groups: groupsArray
  }
});