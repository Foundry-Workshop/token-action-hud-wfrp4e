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
     */
    #actorTypes = ['character', 'npc', 'creature'];
    #equippableTypes = ['weapon', 'armour'];

    #findGroup (data = {}) {
      if (data?.nestId) {
        return this.groups[data.nestId]
      } else {
        return Object.values(this.groups).find(
          group =>
            (!data.id || group.id === data.id) &&
            (!data.type || group.type === data.type) &&
            (!data.level || group.level === data.level)
        )
      }
    }

    async buildSystemActions(groupIds) {
      // Settings
      this.displayUnequipped = Utility.getSetting('displayUnequipped');

      // Set items variable
      if (this.actor) {
        let items = this.actor.items;
        items = coreModule.api.Utils.sortItemsByName(items);
        this.items = items;
      }

      if (this.#actorTypes.includes(this.actor.type)) {
        this.#buildCharacterActions();
      } else if (!this.actor) {
        this.#buildMultipleTokenActions();
      }
    }

    /**
     * Build character actions
     * @private
     */
    #buildCharacterActions() {
      this.#buildCharacteristics();
      this.#buildInventory();
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    #buildMultipleTokenActions() {
    }

    async #buildCharacteristics() {
      const groupData = tah.groups.characteristics;
      const actions = [];

      for (let characteristic in WFRP4E.characteristics) {
        let name = WFRP4E.characteristics[characteristic];
        let actionTypeName = game.i18n.localize(tah.actions.characteristic);
        let listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
        let encodedValue = ['characteristic', characteristic].join(this.delimiter);
        let info1 = {
          class: '', text: this.actor.characteristics[characteristic].value, title: 'Characteristic Value'
        };

        actions.push({
          id: null,
          name,
          listName,
          encodedValue,
          info1
        });
      }

      this.addActions(actions, groupData)
    }

    /**
     * Build inventory
     * @private
     */
    async #buildInventory() {
      if (this.items.size === 0) return;
      const actionTypeId = 'item';
      const inventoryMap = new Map();
      let dynamicGroups = new Map();

      for (const [itemId, itemData] of this.items) {
        let type = itemData.type;

        if (itemData.type === 'skill') {
          switch (itemData.system.advanced.value) {
            case 'adv':
              type = 'skillAdvanced'
              break;
            case 'bsc':
            default:
              type = 'skillBasic'
          }
        } else if (itemData.type === 'spell') {
          switch (itemData.system.lore.value) {
            case 'petty':
              type = 'spellPetty'
              break;
            default:
              type = 'spellArcane'
              let lore = itemData.system.lore.value;
              if (lore) {
                type = `spell${lore}`;
                if (!dynamicGroups.get(lore))
                  dynamicGroups.set(type, {
                    groupData: {
                      id: type,
                      name: WFRP4E.magicLores[lore],
                      listName: `Lore: ${WFRP4E.magicLores[lore]}`,
                      type: 'system'
                    },
                    parentGroupData: tah.groups.spellsArcane
                  });
              }
          }
        } else if (this.#equippableTypes.includes(type) && !(itemData.equipped || this.displayUnequipped)) {
          continue;
        }

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

      for (let [key, groupData] of dynamicGroups) {
        await this.addGroup(groupData.groupData, groupData.parentGroupData);
      }

      for (const [type, typeMap] of inventoryMap) {
        const groupId = tah.items[type]?.groupId ?? this.#findGroup({id: type})?.id;

        if (!groupId) continue;

        const groupData = {id: groupId, type: 'system'};

        // Get actions
        const actions = [...typeMap].map(([itemId, itemData]) => {
          const id = itemId;
          const name = itemData.name;
          const actionTypeName = game.i18n.localize(tah.actions[actionTypeId]);
          const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);
          const img = coreModule.api.Utils.getImage(itemData);

          const info1 = {
            class: '', text: this.#getTestTarget(itemData), title: 'Test Target'
          };
          const info2 = {
            class: '', text: this.#getItemValue(itemData), title: this.#gerItemValueTooltip(itemData)
          };
          const info3 = {
            class: '',
            text: this.#getItemSecondaryValue(itemData),
            title: this.#gerItemSecondaryValueTooltip(itemData)
          };

          return {
            id,
            name,
            img,
            listName,
            encodedValue,
            info1,
            info2,
            info3
          }
        })

        // TAH Core method to add actions to the action list
        this.addActions(actions, groupData);
      }
    }

    #getTestTarget(itemData) {
      let skill;
      if (itemData.type === 'skill')
        skill = itemData;
      else
        skill = itemData.skillToUse;

      return skill?.system.total?.value;
    }

    #getItemValue(itemData) {
      switch (itemData.type) {
        case 'weapon':
          return '+' + itemData.Damage;
        case 'armour':
          let highest = 0;
          for (let loc in itemData.AP) {
            if (itemData.AP[loc] > highest)
              highest = itemData.AP[loc];
          }
          return highest
        case 'spell':
          return `${itemData.cn.value}`;
        default:
          return null;
      }
    }

    #gerItemValueTooltip(itemData) {
      switch (itemData.type) {
        case 'weapon':
        case 'trait':
          return 'Weapon Damage';
        case 'armour':
          return 'Highest AP';
        case 'spell':
          return `Spell's CN`;
        default:
          return null;
      }
    }

    #getItemSecondaryValue(itemData) {
      switch (itemData.type) {
        case 'spell':
          return (itemData.Damage > 0 || itemData.magicMissile?.value === true) ? '+' + itemData.Damage : null;
        default:
          return null;
      }
    }

    #gerItemSecondaryValueTooltip(itemData) {
      switch (itemData.type) {
        case 'spell':
          return `Spell's Damage`;
        default:
          return null;
      }
    }
  }
})