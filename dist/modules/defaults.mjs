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
        nestId: 'inventory',
        id: 'inventory',
        name: game.i18n.localize('Template.Inventory'),
        groups: [
          {...groups.weapons, nestId: 'inventory_weapons'},
          {...groups.armor, nestId: 'inventory_armor'},
          {...groups.equipment, nestId: 'inventory_equipment'},
          {...groups.consumables, nestId: 'inventory_consumables'},
          {...groups.containers, nestId: 'inventory_containers'},
          {...groups.treasure, nestId: 'inventory_treasure'}
        ]
      },
      {
        nestId: 'utility',
        id: 'utility',
        name: game.i18n.localize('tokenActionHud.utility'),
        groups: [
          {...groups.combat, nestId: 'utility_combat'},
          {...groups.token, nestId: 'utility_token'},
          {...groups.rests, nestId: 'utility_rests'},
          {...groups.utility, nestId: 'utility_utility'}
        ]
      }
    ],
    groups: groupsArray
  }
});