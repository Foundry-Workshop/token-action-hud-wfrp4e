import Utility from "./utility/Utility.mjs";
import {settings, tah} from "./constants.mjs";

export let ActionHandlerWfrp4e = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
   * @extends ActionHandler
   */
  ActionHandlerWfrp4e = class ActionHandlerWfrp4e extends coreModule.api.ActionHandler {
    static #firstBuild = true;
    /**
     * Build system actions
     * Called by Token Action HUD Core
     * @override
     * @param {array} groupIds
     */
    #actorTypes = ['character', 'npc', 'creature'];
    #equippableTypes = ['weapon', 'armour'];
    #inventoryTypes = ['weapon', 'armour', 'trapping', 'container', 'ammunition'];
    #displayUnequipped;
    #groupLores;
    #groupTrappings;
    #maxCharacters;
    #useWomChanneling;
    #lores = {};

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
      // need to wait because WFRP4e changes conditions on `ready`...
      if (ActionHandlerWfrp4e.#firstBuild) {
        if (!game.wfrp4e?.config?.statusEffects) {
          setTimeout(
            () => Hooks.callAll('forceUpdateTokenActionHud'),
            500
          );
        } else {
          ActionHandlerWfrp4e.#firstBuild = false;
        }
      }

      // Settings
      this.#displayUnequipped = Utility.getSetting(settings.displayUnequipped);
      this.#groupLores = Utility.getSetting(settings.groupLores);
      this.#groupTrappings = Utility.getSetting(settings.groupTrappings);
      this.#maxCharacters = parseInt(Utility.getSetting(settings.maxCharacters)) ?? 0;
      this.#useWomChanneling = game.settings.get("wfrp4e", "useWoMChannelling")

      // Set items variables
      // Declaring multiple arrays, while taking more memory for sure, should be better
      // than having to reconvert map to array to map every time I want to filter
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

      if (this.actor && this.#actorTypes.includes(this.actor.type)) {
        await this.#buildCharacterActions();
      } else if (!this.actor) {
        await this.#buildMultipleTokenActions();
      }
    }


    //#region Build Actions

    /**
     * Build character actions
     * @private
     */
    async #buildCharacterActions() {
      await this.#buildCharacteristics();
      await this.#buildSkills();
      await this.#buildTalents();
      await this.#buildCombat();
      await this.#buildMagic();
      await this.#buildInventory();
      await this.#buildUtility();

      /**
       * Update Character tab to add Wounds
       * @type {unknown}
       */
      let characterGroup = this.#findGroup({id: 'categoryCharacteristics'})
      // @todo fix info1 to be object {class,text,title} when Core updates
      // group.info1 = {
      //   class: '',
      //   text: `${this.actor.system.status.wounds.value}/${this.actor.system.status.wounds.max}`,
      //   title: ''
      // }
      characterGroup.info1 = `${this.actor.system.status.wounds.value}/${this.actor.system.status.wounds.max}`;
      await this.updateGroup(characterGroup)

      /**
       * Update Combat tab to add Advantage
       */
      let advantage;
      if (game.settings.get("wfrp4e", "useGroupAdvantage") === true) {
        let advantageSetting = game.settings.get("wfrp4e", "groupAdvantageValues");
        advantage = advantageSetting[this.actor.advantageGroup] ?? 0;
      } else {
        advantage = `${this.actor.system.status.advantage.value}/${this.actor.system.status.advantage.max}`
      }

      let combatGroup = this.#findGroup({id: 'categoryCombat'})
      // @todo fix info1 to be object {class,text,title} when Core updates
      combatGroup.info1 = advantage;
      await this.updateGroup(combatGroup)

      /**
       * Update Magic Lores with channeling
       */
      if (this.#useWomChanneling) {
        for (let lore in this.#lores) {
          let group = this.#findGroup({id: this.#lores[lore]});
          let action = group.actions[0] || null;
          if (!action) continue;
          let spell = this.actor.items.find(i => i.type === 'spell' && i._id === action.id);
          if (!spell) continue;
          // @todo fix info1 to be object {class,text,title} when Core updates
          group.info1 = spell.cn.SL;
          await this.updateGroup(group);
        }
      }
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    async #buildMultipleTokenActions() {
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
          id: characteristic,
          name,
          listName,
          encodedValue,
          info1
        });
      }

      return this.addActions(actions, groupData)
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

      return this.#addActionsFromMap(actionTypeId, inventoryMap);
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

      return this.#addActionsFromMap(actionTypeId, inventoryMap);
    };

    async #buildCombat() {
      await this.#buildCombatBasic();

      if (this.talents.size > 0)
        await this.#buildCombatTraits();

      if (game.wfrp4e?.config?.statusEffects)
        await this.#buildConditions();

      if (this.items.size === 0) return;
      await this.#buildCombatWeapons();
      await this.#buildConsumables();
      await this.#buildCombatArmour();
    }


    async #buildCombatBasic() {
      const actionsData = [];
      const actionType = 'combatBasic';
      const groupData = {id: actionType, type: 'system'};

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
        },
        {
          name: game.i18n.localize('SHEET.Stomp'),
          value: 'stomp'
        }
      ];

      for (let action of actions) {
        actionsData.push({
          id: action.value,
          name: action.name,
          encodedValue: [actionType, action.value].join(this.delimiter)
        })
      }

      return this.addActions(actionsData, groupData)
    }

    async #buildCombatWeapons() {
      const actionsData = [];
      const actionType = 'combatWeapon';
      const actionTypeName = game.i18n.localize(tah.actions.weapon);
      const groupData = tah.groups.combatWeapons;

      for (let [key, item] of this.items) {
        if (item.type !== 'weapon') continue;
        if (!this.#displayUnequipped && !item.equipped) continue;

        let icons = this.#getItemIcons(item);
        let action = this.#makeActionFromItem(item, actionTypeName, actionType, icons);
        actionsData.push(action);
      }

      return this.addActions(actionsData, groupData)
    };

    async #buildCombatTraits() {
      const actionsData = [];
      const actionType = 'combatTrait';
      const actionTypeName = game.i18n.localize(tah.actions.trait);
      const groupData = tah.groups.combatTraits;

      for (let [key, item] of this.talents) {
        if (item.type !== 'trait') continue;
        if (!item.rollable?.value) continue;

        let action = this.#makeActionFromItem(item, actionTypeName, actionType);
        actionsData.push(action);
      }

      return this.addActions(actionsData, groupData)
    };

    async #buildConsumables() {
      const actionsData = [];
      const actionType = 'consumable';
      const actionTypeName = game.i18n.localize(tah.actions.consumable);
      const groupData = tah.groups.consumables;
      const invokeIcon = '<i class="fas fa-flask"></i>'
      const targetIcon = '<i class="fas fa-crosshairs"></i>'
      let values = [];

      for (let [key, item] of this.items) {
        let [invokable, targetable] = this.#checkItemEffects(item);
        for (let invk of invokable) {
          if (invk.reduceQuantity && item.quantity.value < 1) continue;
          values = ['invokable', invk._id];
          let action = this.#makeActionFromItem(item, actionTypeName, actionType, {icon1: invokeIcon}, values);
          actionsData.push(action);
        }
        for (let trgt of targetable) {
          if (trgt.reduceQuantity && item.quantity.value < 1) continue;
          values = ['invokable', trgt._id];
          let action = this.#makeActionFromItem(item, actionTypeName, actionType, {icon1: targetIcon}, values);
          actionsData.push(action);
        }
      }

      return this.addActions(actionsData, groupData)
    };

    async #buildCombatArmour() {
    };

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
                          style: this.#groupLores ? 'tab' : 'list'
                        }
                      },
                      parentGroupData: tah.groups.spellsArcane
                    });
                  this.#lores[lore] = type;
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
      return this.#addActionsFromMap(actionTypeId, inventoryMap);
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
                    style: this.#groupTrappings ? 'tab' : 'list'
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
      return this.#addActionsFromMap(actionTypeId, inventoryMap);
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
      return this.#buildContainerItems(container.groupData);
    }

    async #buildContainerItems(container) {
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

      return this.#addActionsFromMap(actionTypeId, inventoryMap, container.id);
    }

    async #buildUtility() {
      const actionType = 'utility';

      const combatTypes = {
        initiative: {id: 'initiative', name: game.i18n.localize('tokenActionHud.wfrp4e.rollInitiative')},
        endTurn: {id: 'endTurn', name: game.i18n.localize('tokenActionHud.endTurn')}
      }

      if (game.combat?.current?.tokenId !== this.token?.id) delete combatTypes.endTurn

      const actions = Object.entries(combatTypes).map((combatType) => {
        const id = combatType[1].id;
        const name = combatType[1].name;
        const actionTypeName = `${coreModule.api.Utils.i18n(tah.actions[actionType])}: ` ?? '';
        const listName = `${actionTypeName}${name}`;
        const encodedValue = [actionType, id].join(this.delimiter);
        const info1 = {};
        let cssClass = '';
        if (combatType[0] === 'initiative' && game.combat) {
          const tokenIds = canvas.tokens.controlled.map((token) => token.id);
          const combatants = game.combat.combatants.filter((combatant) => tokenIds.includes(combatant.tokenId));

          // Get initiative for single token
          if (combatants.length === 1) {
            const currentInitiative = combatants[0].initiative;
            info1.class = 'tah-spotlight';
            info1.text = currentInitiative;
          }

          const active = combatants.length > 0 && (combatants.every((combatant) => combatant?.initiative)) ? ' active' : '';
          cssClass = `toggle${active}`;
        }
        return {
          id,
          name,
          encodedValue,
          info1,
          cssClass,
          listName
        }
      })

      const groupData = {id: 'combat', type: 'system'}
      return this.addActions(actions, groupData)
    }

    /**
     * Build conditions
     * @private
     */
    async #buildConditions() {
      if (!this.token) return;
      const actionType = 'condition';
      const conditions = game.wfrp4e.config.statusEffects.filter((condition) => condition.id !== '');
      if (conditions.length === 0) return;

      const actions = conditions.map((condition) => {
        const id = condition.id;
        const name = coreModule.api.Utils.i18n(condition.label) ?? condition.name;
        const actionTypeName = `${coreModule.api.Utils.i18n(tah.actions[actionType])}: ` ?? '';
        const listName = `${actionTypeName}${name}`;
        const encodedValue = [actionType, id].join(this.delimiter);
        const effect = this.actor.effects.find(effect => effect.statuses.some(status => status === id) && !effect?.disabled);
        const active = effect ? ' active' : '';
        const info1 = this.#getConditionInfo(condition, effect);
        const icon1 = this.#getConditionIcon(condition, effect);
        const cssClass = `toggle${active}`;
        const img = coreModule.api.Utils.getImage(condition);
        const tooltip = this.#getConditionTooltipData(id);
        return {
          id,
          name,
          encodedValue,
          img,
          cssClass,
          listName,
          tooltip,
          info1,
          icon1
        }
      });

      const groupData = {id: 'conditions', type: 'system'}
      return this.addActions(actions, groupData)
    }

    #getConditionInfo(condition, effect) {
      if (!condition.flags.wfrp4e.value) return null;

      return {
        class: '',
        text: effect?.flags.wfrp4e?.value ?? '0',
        title: 'Condition Rating'
      }
    }

    #getConditionIcon(condition, effect) {
      if (condition.flags.wfrp4e.value) return null;
      const hasCondition = '<i class="far fa-circle-dot"></i>';
      const noCondition = '<i class="far fa-circle"></i>';

      return effect ? hasCondition : noCondition;
    }

    /**
     * Get condition tooltip data
     * @param {*} id     The condition id
     * @returns {object} The tooltip data
     */
    #getConditionTooltipData(id) {
      let tooltip = `<h2>${game.wfrp4e.config.conditions[id]}</h2>` + game.wfrp4e.config.conditionDescriptions[id];
      const regex = /@[a-zA-Z]+\[[a-zA-Z0-9._-]+]{([^}]+)}/g
      const regexShort = /@[a-zA-Z]+\[([a-zA-Z0-9._-]+)](?!{)/g
      tooltip = tooltip.replaceAll(regex, '<strong>$1</strong>');
      return tooltip.replaceAll(regexShort, '<strong>$1</strong>');
    }

    /**
     * Build effects
     * @private
     */
    async #buildEffects() {
      // const actionType = 'effect'
      //
      // // Get effects
      // const effects = this.actor.effects
      //
      // // Exit if no effects exist
      // if (effects.size === 0) return
      //
      // // Map passive and temporary effects to new maps
      // const passiveEffects = new Map()
      // const temporaryEffects = new Map()
      //
      // // Iterate effects and add to a map based on the isTemporary value
      // for (const [effectId, effect] of effects.entries()) {
      //   const isTemporary = effect.isTemporary
      //   if (isTemporary) {
      //     temporaryEffects.set(effectId, effect)
      //   } else {
      //     passiveEffects.set(effectId, effect)
      //   }
      // }
      //
      // await Promise.all([
      //   // Build passive effects
      //   this.#buildActions(passiveEffects, { id: 'passive-effects', type: 'system' }, actionType),
      //   // Build temporary effects
      //   this.#buildActions(temporaryEffects, { id: 'temporary-effects', type: 'system' }, actionType)
      // ])
    }

    //#endregion

    async #addDynamicGroups(dynamicGroups) {
      for (let [key, groupData] of dynamicGroups) {
        await this.addGroup(groupData.groupData, groupData.parentGroupData);
      }
    }

    #makeActionFromItem(item, actionTypeName, actionType, {
      icon1 = null,
      icon2 = null,
      icon3 = null
    } = {}, values = []) {
      values = [actionType, item._id, ...values];

      return {
        id: item._id,
        name: this.#getActionName(item.name),
        img: coreModule.api.Utils.getImage(item),
        icon1,
        icon2,
        icon3,
        listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${item.name}`,
        encodedValue: values.join(this.delimiter),
        info1: {
          class: '',
          text: this.#getTestTarget(item),
          title: 'Test Target'
        },
        info2: {
          class: '',
          text: this.#getItemValue(item),
          title: this.#getItemValueTooltip(item)
        },
        info3: {
          class: '',
          text: this.#getItemSecondaryValue(item),
          title: this.#getItemSecondaryValueTooltip(item)
        },
        tooltip: item.name
      };
    }

    /**
     *
     * @param {string} actionTypeId
     * @param {Map<string,Map>} inventoryMap
     * @param {string|null} parentGroup
     */
    async #addActionsFromMap(actionTypeId, inventoryMap, parentGroup = null) {
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
          const {icon1, icon2, icon3} = this.#getItemIcons(itemData);

          const info1 = {
            class: '', text: this.#getTestTarget(itemData), title: 'Test Target'
          };
          const info2 = {
            class: '', text: this.#getItemValue(itemData), title: this.#getItemValueTooltip(itemData)
          };
          const info3 = {
            class: '',
            text: this.#getItemSecondaryValue(itemData),
            title: this.#getItemSecondaryValueTooltip(itemData)
          };

          return {
            id,
            name,
            img,
            listName,
            encodedValue,
            icon1,
            icon2,
            icon3,
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
      if (this.#maxCharacters > 0) {
        return name.substring(0, this.#maxCharacters) + '…';
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
          return `${this.#containerCarries(itemData)}/${itemData.system.carries.value}`;
        case 'armour':
          let highest = 0;
          for (let loc in itemData.AP) {
            if (itemData.AP[loc] > highest)
              highest = itemData.AP[loc];
          }
          return highest
        case 'spell':
          if (this.#useWomChanneling && itemData.lore?.value && this.#groupLores)
            return `${itemData.cn.value}`;
          else
            return `${itemData.cn.SL}/${itemData.cn.value}`;
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

    #getItemSecondaryValueTooltip(itemData) {
      switch (itemData.type) {
        case 'spell':
          return `Spell's Damage`;
        default:
          return null;
      }
    }

    #checkItemEffects(item) {
      let invokable = item.effects.filter(e => e.trigger === "invoke");
      let targetable = item.effects.filter(e => e.application === "apply");

      return [invokable, targetable]
    }

    #getItemIcons(item) {
      const iconWeaponEquipped = '<i class="fas fa-hand"></i>';
      const iconWeaponLoaded = '<i class="far fa-circle-dot"></i>';
      const iconWeaponNotLoaded = '<i class="far fa-circle-xmark"></i>';
      let icon1 = null;
      let icon2 = null;
      let icon3 = null;

      switch (item.type) {
        case 'weapon':
          icon1 = (item.equipped) ? iconWeaponEquipped : null;
          if (this.#isWeaponLoadable(item))
            icon2 = this.#isWeaponLoaded(item) ? iconWeaponLoaded : iconWeaponNotLoaded;
          break;
        case 'armour':
        default:
      }

      return {icon1, icon2, icon3};
    }

    /**
     *
     * @param item
     */
    #isWeaponLoadable(item) {
      return !!item.loading?.value;
    }

    /**
     * @param item
     * @return {boolean}
     */
    #isWeaponLoaded(item) {
      return !!item.loaded?.value;
    }

  }
})