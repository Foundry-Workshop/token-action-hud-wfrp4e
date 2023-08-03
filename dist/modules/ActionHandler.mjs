import Utility from "./utility/Utility.mjs";
import {settings, tah} from "./constants.mjs";

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
    #inventoryTypes = ['weapon', 'armour', 'trapping', 'container', 'ammunition'];

    #findGroup(data = {}) {
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
      this.displayUnequipped = Utility.getSetting(settings.displayUnequipped);
      this.groupLores = Utility.getSetting(settings.groupLores);
      this.groupTrappings = Utility.getSetting(settings.groupTrappings);
      this.maxCharacters = parseInt(Utility.getSetting(settings.maxCharacters)) ?? 0;

      // Set items variable
      if (this.actor) {
        let skills = this.actor.items.filter(i => i.type === 'skill');
        let talents = this.actor.items.filter(i => i.type === 'talent' || i.type === 'trait');
        let magic = this.actor.items.filter(i => i.type === 'spell' || i.type === 'prayer');
        let items = this.actor.items.filter(i => !i.location?.value && this.#inventoryTypes.includes(i.type));
        let itemsInContainers = this.actor.items.filter(i => !!i.location?.value && this.#inventoryTypes.includes(i.type));

        this.skills = coreModule.api.Utils.sortItemsByName(skills);
        this.talents = coreModule.api.Utils.sortItemsByName(talents);
        this.magic = coreModule.api.Utils.sortItemsByName(magic);
        this.items = coreModule.api.Utils.sortItemsByName(items);
        this.itemsInContainers = coreModule.api.Utils.sortItemsByName(itemsInContainers);
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
      this.#buildSkills();
      this.#buildTalents();
      this.#buildCombat();
      this.#buildMagic();
      this.#buildInventory();
      this.#buildUtility();
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

    async #buildSkills() {
      if (this.skills.size === 0) return;
      const actionTypeId = 'skill';
      const inventoryMap = new Map();

      for (let [itemKey, itemData] of this.skills) {
        let itemId = itemData._id;
        let type = itemData.type;

        switch (itemData.system.advanced.value) {
          case 'adv':
            type = 'skillAdvanced'
            break;
          case 'bsc':
          default:
            type = 'skillBasic'
        }

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

      this.#addActionsFromMap(actionTypeId, inventoryMap);
    };

    async #buildTalents() {
      if (this.talents.size === 0) return;
      const actionTypeId = 'talent';
      const inventoryMap = new Map();

      for (let [itemKey, itemData] of this.talents) {
        const typeMap = inventoryMap.get(itemData.type) ?? new Map();
        typeMap.set(itemData._id, itemData);
        inventoryMap.set(itemData.type, typeMap);
      }

      this.#addActionsFromMap(actionTypeId, inventoryMap);
    };

    async #buildCombat() {
      await this.#buildCombatBasic();
      if (this.items.size === 0) return;
    }

    async #buildCombatBasic() {
      const actionsData = []
      const actionType = 'combatBasic'
      const groupData = {id: actionType, type: 'system'}

      let actions = [
        {
          name: game.i18n.localize('SHEET.Unarmed'),
          value: 'unarmed',
        },
        {
          name: game.i18n.localize('SHEET.Dodge'),
          value: 'dodge'
        },
        {
          name: game.i18n.localize('SHEET.Improvised'),
          value: 'improv'
        }
      ];

      for (let action of actions) {
        actionsData.push({
          id: action.value,
          name: action.name,
          encodedValue: [actionType, action.value].join(this.delimiter)
        })
      }

      this.addActions(actionsData, groupData)
    }

    async #buildMagic() {
      if (this.magic.size === 0) return;
      const actionTypeId = 'magic';
      const inventoryMap = new Map();
      const dynamicGroups = new Map();

      for (let [itemKey, itemData] of this.magic) {
        let itemId = itemData._id;
        let type;

        switch (itemData.type) {
          case 'spell':
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
                        type: 'system',
                        settings: {
                          style: this.groupLores ? 'tab' : 'list'
                        }
                      },
                      parentGroupData: tah.groups.spellsArcane
                    });
                }
            }
            break;
          case 'prayer':
            type = itemData.system.type.value;
            break;
          default:
            continue;
        }

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

      await this.#addDynamicGroups(dynamicGroups);
      this.#addActionsFromMap(actionTypeId, inventoryMap);
    };

    /**
     * Build inventory
     * @private
     */
    async #buildInventory() {
      if (this.items.size === 0) return;
      const actionTypeId = 'item';
      const inventoryMap = new Map();
      const dynamicGroups = new Map();

      for (const [itemKey, itemData] of this.items) {
        let itemId = itemData._id;
        let type = itemData.type;

        switch (itemData.type) {
          case 'trapping':
            type = itemData.system.trappingType.value;
            if (!dynamicGroups.get(type))
              dynamicGroups.set(type, {
                groupData: {
                  id: type,
                  name: WFRP4E.trappingCategories[type],
                  listName: `Trapping: ${WFRP4E.trappingCategories[type]}`,
                  type: 'system',
                  settings: {
                    style: this.groupTrappings ? 'tab' : 'list'
                  }
                },
                parentGroupData: tah.groups.trappings
              });
            break;
          case 'container':
            this.#buildContainer(itemData, tah.groups.containers);
            continue;
          case 'ammunition':
          case 'armour':
          case 'weapon':
            break;
          case 'skill':
          case 'spell':
          case 'talent':
          case 'trait':
          case 'prayer':
          default:
            continue;
        }

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

      await this.#addDynamicGroups(dynamicGroups);
      this.#addActionsFromMap(actionTypeId, inventoryMap);
    }

    async #addDynamicGroups(dynamicGroups) {
      for (let [key, groupData] of dynamicGroups) {
        await this.addGroup(groupData.groupData, groupData.parentGroupData);
      }
    }

    async #buildContainer(item, parent = null) {
      const parentGroup = parent ?? tah.groups.containers;
      const container = {
        groupData: {
          id: item._id,
          name: item.name,
          listName: `Container: ${item.name}`,
          type: 'system',
          settings: {
            image: coreModule.api.Utils.getImage(item),
            style: 'tab'
          },
          // info2: {
          //   class: '',
          //   text: this.#getItemValue(item),
          //   title: this.#getItemValueTooltip(item)
          // }
        },
        parentGroupData: parentGroup
      };

      await this.addGroup(container.groupData, container.parentGroupData);
      this.#buildContainerItems(container.groupData);
    }

    #buildContainerItems(container) {
      if (this.itemsInContainers.size === 0) return;
      const actionTypeId = 'item';
      const inventoryMap = new Map();

      for (const [itemKey, itemData] of this.itemsInContainers) {
        if (itemData.location?.value !== container.id) continue;
        let itemId = itemData._id;
        let type = itemData.type;

        switch (itemData.type) {
          case 'container':
            this.#buildContainer(itemData, container);
            continue;
          case 'trapping':
          case 'ammunition':
          case 'armour':
          case 'weapon':
            break;
          default:
            continue;
        }

        const typeMap = inventoryMap.get(type) ?? new Map();
        typeMap.set(itemId, itemData);
        inventoryMap.set(type, typeMap);
      }

      this.#addActionsFromMap(actionTypeId, inventoryMap, container.id);
    }

    async #buildUtility() {
    };

    /**
     *
     * @param {string} actionTypeId
     * @param {Map<string,Map>} inventoryMap
     * @param {string|null} parentGroup
     */
    #addActionsFromMap(actionTypeId, inventoryMap, parentGroup = null) {
      for (const [type, typeMap] of inventoryMap) {
        const groupId = parentGroup ?? tah.items[type]?.groupId ?? this.#findGroup({id: type})?.id;

        if (!groupId) continue;

        const groupData = {id: groupId, type: 'system'};

        const actions = [...typeMap].map(([itemId, itemData]) => {
          const id = itemId;
          const name = this.#getActionName(itemData.name);
          const actionTypeName = game.i18n.localize(tah.actions[actionTypeId]);
          const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${itemData.name}`;
          const encodedValue = [actionTypeId, id].join(this.delimiter);
          const img = coreModule.api.Utils.getImage(itemData);
          const tooltip = itemData.name;

          const info1 = {
            class: '', text: this.#getTestTarget(itemData), title: 'Test Target'
          };
          const info2 = {
            class: '', text: this.#getItemValue(itemData), title: this.#getItemValueTooltip(itemData)
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
            info3,
            tooltip
          }
        })

        this.addActions(actions, groupData);
      }
    }

    #getActionName(name) {
      if (this.maxCharacters > 0) {
        return name.substring(0, this.maxCharacters) + '…';
      }

      return name;
    }

    #containerCarries(item) {
      if (item.carries.current === undefined) {
        const itemsInside = this.actor.items.filter(i => i.location?.value === item._id);
        item.carries.current = itemsInside.reduce(function (prev, cur) {   // cont.holding -> total encumbrance the container is holding
          return Number(prev) + Number(cur.encumbrance.value);
        }, 0);
        item.carries.current = Math.floor(item.carries.current * 10) / 10;
      }

      return item.carries.current;
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
        case 'trapping':
        case 'ammunition':
          return itemData.quantity.value;
        case 'container':
          console.log(itemData);
          return `${this.#containerCarries(itemData)}/${itemData.system.carries.value}`;
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

    #getItemValueTooltip(itemData) {
      switch (itemData.type) {
        case 'weapon':
        case 'trait':
          return 'Weapon Damage';
        case 'trapping':
        case 'ammunition':
          return 'Quantity';
        case 'container':
          return 'Encumbrance';
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