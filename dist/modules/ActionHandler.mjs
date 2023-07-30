import Utility from "./utility/Utility.mjs";
import {tah} from "./constants.mjs";

export let ActionHandlerWfrp4e = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   * @extends ActionHandler
   */
  ActionHandlerWfrp4e = class ActionHandlerWfrp4e extends coreModule.api.ActionHandler {
    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     * @param {array} groupIds
     */a
    async buildSystemActions (groupIds) {
      this.actorType = this.actor?.type

      // Settings
      this.displayUnequipped = Utility.getSetting('displayUnequipped')

      // Set items variable
      if (this.actor) {
        let items = this.actor.items
        items = coreModule.api.Utils.sortItemsByName(items)
        this.items = items
      }

      if (this.actorType === 'character') {
        this.#buildCharacterActions()
      } else if (!this.actor) {
        this.#buildMultipleTokenActions()
      }
    }

    /**
     * Build character actions
     * @private
     */
    #buildCharacterActions () {
      this.#buildInventory()
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions () {
    }

    /**
     * Build inventory
     * @private
     */
    async #buildInventory () {
      if (this.items.size === 0) return

      const actionTypeId = 'item'
      const inventoryMap = new Map()

      for (const [itemId, itemData] of this.items) {
        const type = itemData.type
        const equipped = itemData.equipped

        if (equipped || this.displayUnequipped) {
          const typeMap = inventoryMap.get(type) ?? new Map()
          typeMap.set(itemId, itemData)
          inventoryMap.set(type, typeMap)
        }
      }

      for (const [type, typeMap] of inventoryMap) {
        const groupId = tah.items[type]?.groupId

        if (!groupId) continue

        const groupData = { id: groupId, type: 'system' }

        // Get actions
        const actions = [...typeMap].map(([itemId, itemData]) => {
          const id = itemId
          const name = itemData.name
          const actionTypeName = game.i18n.localize(tah.actions[actionTypeId])
          const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`
          const encodedValue = [actionTypeId, id].join(this.delimiter)

          return {
            id,
            name,
            listName,
            encodedValue
          }
        })

        // TAH Core method to add actions to the action list
        this.addActions(actions, groupData)
      }
    }
  }
})