import Utility from "./utility/Utility.mjs";
import {constants, settings, tah} from "./constants.mjs";
import GroupAdvantage from "./GroupAdvantage.js";
import {awardXP, testOptions} from "./actionHelpers.mjs";

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
    #equippableTypes = ['weapon', 'armour', 'forien-armoury.grimoire'];
    #inventoryTypes = ['weapon', 'armour', 'trapping', 'container', 'ammunition', 'forien-armoury.scroll', 'forien-armoury.grimoire'];
    #displayUnequipped;
    #groupLores;
    #groupTrappings;
    #maxCharacters;
    #useWomChanneling;
    #lores = {};

    #findGroup(data = {}) {
      if (data?.nestId) {
        return this.groupHandler.groups[data.nestId]
      } else {
        return Object.values(this.groupHandler.groups).find(
          group =>
            (!data.id || group.id === data.id) &&
            (!data.type || group.type === data.type) &&
            (!data.level || group.level === data.level)
        )
      }
    }

    async buildSystemActions(groupIds) {
      // Settings
      this.#displayUnequipped = Utility.getSetting(settings.displayUnequipped);
      this.#groupLores = Utility.getSetting(settings.groupLores);
      this.#groupTrappings = Utility.getSetting(settings.groupTrappings);
      this.#maxCharacters = parseInt(Utility.getSetting(settings.maxCharacters)) ?? 0;
      this.#useWomChanneling = game.settings.get("wfrp4e", "useWoMChannelling");

      // Set items variables
      // Declaring multiple arrays, while taking more memory for sure, should be better
      // than having to reconvert map to array to map every time I want to filter
      if (this.actor) {
        let skills = this.actor.items.filter(i => i.type === 'skill');
        let talents = this.#getActorTalents();
        let magic = this.actor.items.filter(i => i.type === 'spell' || i.type === 'prayer');
        let items = this.actor.items.filter(i => !i.location?.value && this.#inventoryTypes.includes(i.type));
        let extended = this.actor.items.filter(i => i.type === 'extendedTest');
        let itemsInContainers = this.actor.items.filter(i => !!i.location?.value && this.#inventoryTypes.includes(i.type));

        this.skills = coreModule.api.Utils.sortItemsByName(skills);
        this.talents = coreModule.api.Utils.sortItemsByName(talents);
        this.magic = coreModule.api.Utils.sortItemsByName(magic);
        this.items = coreModule.api.Utils.sortItemsByName(items);
        this.extended = coreModule.api.Utils.sortItemsByName(extended);
        this.itemsInContainers = coreModule.api.Utils.sortItemsByName(itemsInContainers);
      }

      if (this.actor && this.#actorTypes.includes(this.actor.type)) {
        await this.#buildCharacterActions();
      } else if (!this.actor) {
        await this.#buildMultipleTokenActions();
      }
    }

    #getActorTalents() {
      let talents = this.actor.items.filter(i => i.type === 'talent' || i.type === 'trait');
      let consolidated = [];
      for (let talent of talents) {
        let existing = consolidated.find(t => t.name === talent.name);
        if (!existing)
          consolidated.push(talent);
      }
      return consolidated;
    }

    //#region Build Actions

    /**
     * Build character actions
     * @private
     */
    async #buildCharacterActions() {
      await this.#buildCharacteristics();
      await this.#buildSkills();
      await this.#buildExtendedTests();
      await this.#buildTalents();
      await this.#buildCombat();
      await this.#buildMagic();
      await this.#buildInventory();
      await this.#buildUtility();


      /**
       * Update Character tab to add Wounds
       * @type {unknown}
       */
      const percentage = Math.round((this.actor.system.status.wounds.value / this.actor.system.status.wounds.max) * 100);
      let cls = '';

      if (percentage <= 0)
        cls = 'death';
      else if (percentage <= 25)
        cls = 'danger';
      else if (percentage <= 70)
        cls = 'medium';
      else
        cls = 'healthy';

      await this.addGroupInfo({
        id: 'categoryCharacteristics',
        info: {
          info1: {
            class: cls,
            text: `${this.actor.system.status.wounds.value}/${this.actor.system.status.wounds.max}`,
            title: game.i18n.localize('Wounds')
          }
        }
      });

      /**
       * Update Combat tab to add Advantage
       */
      if (game.combat?.combatants?.some(combatant => combatant.actorId === this.actor._id)) {
        let advantage;
        if (game.settings.get("wfrp4e", "useGroupAdvantage") === true) {
          let advantageSetting = game.settings.get("wfrp4e", "groupAdvantageValues");
          advantage = advantageSetting[this.actor.advantageGroup] || ' 0';
        } else {
          advantage = `${this.actor.system.status.advantage.value}/${this.actor.system.status.advantage.max}`
        }

        await this.addGroupInfo({
          id: 'categoryCombat',
          info: {
            info1: {
              class: '',
              text: advantage,
              title: game.i18n.localize('Advantage')
            }
          }
        });
      }

      /**
       * Update Magic Lores with channeling
       */
      if (this.#useWomChanneling) {
        for (let lore in this.#lores) {
          let group = this.#findGroup({id: this.#lores[lore]});
          if (!group) continue;
          let action = group.actions[0] || null;
          if (!action) continue;
          let spell = this.actor.items.find(i => i.type === 'spell' && i._id === action.id);
          if (!spell) continue;

          await this.addGroupInfo({
            id: this.#lores[lore],
            info: {
              info1: {
                class: '',
                text: spell.cn.SL,
                title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ChannellingSL')
              }
            }
          });
        }
      }
    }

    /**
     * Build multiple token actions
     * @private
     * @returns {object}
     */
    async #buildMultipleTokenActions() {
      await this.#buildCharacteristics();
      await this.#buildMultipleBasicSkills();
      await this.#buildMultipleExtendedTests();
      await this.#buildCombatBasic();
      await this.#buildConditions();
      await this.#buildUtility();
    }

    async #buildCharacteristics() {
      const groupData = tah.groups.characteristics;
      const actions = [];

      for (let characteristic in WFRP4E.characteristics) {
        let name = WFRP4E.characteristics[characteristic];
        let actionTypeName = game.i18n.localize(tah.actions.characteristic);
        let listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
        let info1 = this.actor ? {
          class: '',
          text: this.actor.characteristics[characteristic].value,
          title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.CharacteristicValue')
        } : '';

        actions.push({
          id: characteristic,
          name,
          listName,
          info1,
          onClick: () => {
            for (const actor of this.actors) {
              actor.setupCharacteristic(characteristic, testOptions()).then(test => test.roll());
            }
          }
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

    async #buildMultipleBasicSkills() {
      const skills = this.actors[0]?.itemTypes.skill || [];
      const actionTypeId = 'skill';
      const actions = [];
      const type = 'skillBasic';

      const groupId = tah.items[type]?.groupId ?? this.#findGroup({id: type})?.id;
      if (!groupId) return;
      const groupData = {id: groupId, type: 'system'};

      for (let skill of skills) {
        const actionTypeName = game.i18n.localize(tah.actions[actionTypeId]);

        if (!this.actors.every(a => a.itemTypes.skill.find(s => s.name === skill.name)))
          continue;

        actions.push({
          id: skill.id,
          name: this.#getActionName(skill.name),
          img: coreModule.api.Utils.getImage(skill),
          listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${skill.name}`,
          tooltip: game.wfrp4e.config.characteristics[skill.system.characteristic.value],
          onClick: () => {
            for (const actor of this.actors) {
              let skillToUse = actor.itemTypes.skill.find(s => s.name === skill.name);
              let options = testOptions();

              if (skillToUse)
                actor.setupSkill(skillToUse, options).then(test => test.roll());
            }
          }
        })
      }

      this.addActions(actions, groupData);
    };

    async #buildExtendedTests() {
      if (this.extended.size === 0) return;
      const actions = [];
      const actionType = 'extendedTest';
      const actionTypeName = 'Extended Test';
      const groupData = tah.groups.extendedTests;

      for (let [key, item] of this.extended) {
        if (item.system.hide.test && !game.user.isGM) continue;
        let action = this.#makeActionFromItem(item, actionTypeName, actionType, {}, [], false);
        actions.push(action);
      }

      await this.addActions(actions, groupData);
    };

    async #buildMultipleExtendedTests() {
      const tests = this.actors[0]?.itemTypes.extendedTest || [];
      const actions = [];
      const actionTypeName = 'Extended Test';
      const groupData = tah.groups.extendedTests;

      for (let item of tests) {
        if (item.system.hide.test && !game.user.isGM) continue;

        if (!this.actors.every(a => a.itemTypes.extendedTest.find(s => s.name === item.name)))
          continue;

        actions.push({
          id: item._id,
          name: this.#getActionName(item.name),
          img: null,
          listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${item.name}`,
          info1: {
            class: '',
            text: this.#getTestTarget(item),
            title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.TestTarget')
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
          tooltip: item.name,
          onClick: () => {
            for (const actor of this.actors) {
              let extendedTest = actor.itemTypes.extendedTest.find(e => e.name === item.name);
              let options = testOptions();

              if (extendedTest)
                actor.setupExtendedTest(extendedTest, options);
            }
          }
        });
      }

      await this.addActions(actions, groupData);
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

      if (
        game.modules.get("wfrp4e-up-in-arms")?.protected &&
        game.settings.get("wfrp4e", "useGroupAdvantage")
      ) {
        await this.#buildCombatGroupAdvantage();
      }

      if (this.talents.size > 0)
        await this.#buildCombatTraits();

      if (game.wfrp4e?.config?.statusEffects)
        await this.#buildConditions();

      if (this.talents.size > 0 || this.items.size > 0) {
        await this.#buildManualEffects();
        await this.#buildTestIndependentEffects();
      }

      if (this.items.size === 0) return;
      await this.#buildCombatWeapons();
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
          onClick: () => {
            let unarmed = game.wfrp4e.config.systemItems.unarmed;
            for (const actor of this.actors) {
              actor.setupWeapon(unarmed, testOptions()).then(test => test.roll());
            }
          }
        },
        {
          name: game.i18n.localize('SHEET.Dodge'),
          value: 'dodge',
          onClick: () => {
            for (const actor of this.actors) {
              actor.setupSkill(game.i18n.localize("NAME.Dodge"), testOptions()).then(test => test.roll());
            }
          }
        },
        {
          name: game.i18n.localize('SHEET.Improvised'),
          value: 'improv',
          onClick: () => {
            let improv = game.wfrp4e.config.systemItems.improv;
            for (const actor of this.actors) {
              actor.setupWeapon(improv, testOptions()).then(test => test.roll());
            }
          }
        },
        {
          name: game.i18n.localize('SHEET.Stomp'),
          value: 'stomp',
          onClick: () => {
            let stomp = game.wfrp4e.config.systemItems.stomp;
            for (const actor of this.actors) {
              actor.setupTrait(stomp, testOptions()).then(test => test.roll());
            }
          }
        }
      ];

      for (let action of actions) {
        actionsData.push({
          id: action.value,
          name: action.name,
          onClick: action.onClick
        })
      }

      return this.addActions(actionsData, groupData)
    }

    async #buildCombatGroupAdvantage() {
      const actionsData = [];
      const actionType = 'combatAdvantage';
      const groupData = {id: actionType, type: 'system'};

      for (let [key, action] of Object.entries(GroupAdvantage.actions)) {
        if (!GroupAdvantage.canUse(this.actor, action, {silent: true})) continue;

        actionsData.push({
          id: key,
          name: game.i18n.localize(action.name),
          encodedValue: [actionType, key].join(this.delimiter)
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
        if (item.type !== 'weapon' && item.type !== 'forien-armoury.grimoire') continue;
        if (!this.#displayUnequipped && !item.system.isEquipped) continue;

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
        if (!item.system.enabled) continue;

        let action = this.#makeActionFromItem(item, actionTypeName, actionType);
        actionsData.push(action);
      }

      return this.addActions(actionsData, groupData)
    };

    async #buildTestIndependentEffects() {
      const actionsData = [];
      const actionType = 'testIndependentEffect';
      const actionTypeName = game.i18n.localize(tah.actions.testIndependentEffect);
      const groupData = tah.groups.testIndependentEffects;
      const itemsWithTestIndependentEffects = new Set([...this.items, ...this.talents]);

      for (let [index, item] of itemsWithTestIndependentEffects) {
        for (let effect of item.testIndependentEffects) {
          const values = [actionType, item._id, effect.uuid];

          const invokeIcon = effect.isTargetApplied ? '<i class="fas fa-crosshairs"></i>'  : '<i class="fas fa-ruler-combined"></i>';

          let action = {
            id: `${effect._id}`,
            name: this.#getActionName(effect.name),
            img: effect.icon ?? null,
            icon1: invokeIcon,
            icon2: '',
            icon3: '',
            listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${item.name}`,
            encodedValue: values.join(this.delimiter),
            info1: {
              class: '',
              text: effect.system.transferData.type === "area" ? effect.system.transferData.area.radius : '',
              title: effect.system.transferData.type === "area" ? game.i18n.localize('tokenActionHud.wfrp4e.tooltips.Radius') : ''
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
            tooltip: item.name + ' — ' + (effect.isTargetApplied ? game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ManualInvokeTarget') : game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ManualInvokeArea'))
          };

          actionsData.push(action);
        }
      }

      return this.addActions(actionsData, groupData)
    }

    async #buildManualEffects() {
      const actionsData = [];
      const actionType = 'manualEffect';
      const actionTypeName = game.i18n.localize(tah.actions.manualEffect);
      const groupData = tah.groups.manualEffects;
      const invokeIcon = '<i class="fas fa-flask"></i>';
      let values = [];

      const itemsWithManualEffects = new Set([...this.items, ...this.talents]);

      for (let [index, item] of itemsWithManualEffects) {
        for (let script of item.manualScripts) {
          let effect = script.effect;
          values = [actionType, item._id, effect.uuid, script.index];

          let action = {
            id: `${effect._id}.${script.index}`,
            name: this.#getActionName(script.Label),
            img: effect.icon ?? null,
            icon1: invokeIcon,
            icon2: '',
            icon3: '',
            listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${item.name}`,
            encodedValue: values.join(this.delimiter),
            info1: {
              class: '',
              text: this.#getTestTarget(item),
              title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ManualInvoke')
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
            tooltip: effect.name
          };

          actionsData.push(action);
        }
      }

      return this.addActions(actionsData, groupData)
    }

    async #buildConsumables() {
      const actionsData = [];
      const actionType = 'consumable';
      const actionTypeName = game.i18n.localize(tah.actions.consumable);
      const groupData = tah.groups.consumables;
      const invokeIcon = '<i class="fas fa-flask"></i>'
      const targetIcon = '<i class="fas fa-crosshairs"></i>'
      let values = [];

      const consumables = new Map([...this.items, ...this.talents]);

      for (let [key, item] of consumables) {
        let [invokable, targetable] = this.#checkItemEffects(item);
        for (let invk of invokable) {
          if (invk.reduceQuantity && item.quantity.value < 1) continue;
          values = ['invokable', invk._id];
          let action = this.#makeActionFromItem(item, actionTypeName, actionType, {icon1: invokeIcon}, values);
          actionsData.push(action);
        }
        for (let trgt of targetable) {
          if (trgt.reduceQuantity && item.quantity.value < 1) continue;
          values = ['targetable', trgt._id];
          let action = this.#makeActionFromItem(item, actionTypeName, actionType, {icon1: targetIcon}, values);
          actionsData.push(action);
        }
      }

      return this.addActions(actionsData, groupData)
    };

    async #buildCombatArmour() {
      const locations = WFRP4E.locations;
      const armour = this.actor.armour;
      const tb = this.actor.characteristics.t.bonus;
      const actionsData = [];
      const groupData = tah.groups.combatArmour;
      const actionType = 'combatArmour';
      const actionTypeName = 'Armour';
      const shieldIcon = '<i class="fas fa-shield"></i>';
      const armourIcon = '<i class="fas fa-shirt"></i>';
      let icon2 = armour.shield ? shieldIcon : null;

      for (let location in locations) {
        const armourData = armour[location];
        let icon1 = armour[location].value ? armourIcon : null;
        actionsData.push({
          id: location,
          name: this.#getActionName(armour[location].label),
          // img: coreModule.api.Utils.getImage(item),
          icon1,
          icon2,
          cssClass: 'disabled',
          listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${armour[location].label}`,
          encodedValue: [actionType, location].join(this.delimiter),
          info1: {
            class: 'armour-ap',
            text: armour[location].value,
            title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.AP')
          },
          info2: {
            class: 'armour-shield',
            text: armour.shield,
            title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.Shield')
          },
          info3: {
            class: 'armour-tb',
            text: tb,
            title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.TB')
          },
          tooltip: armour[location].label
        });

      }

      return this.addActions(actionsData, groupData)
    };

    /**
     * Build conditions
     * @private
     */
    async #buildConditions() {
      const actionType = 'condition';
      const conditions = game.wfrp4e.config.statusEffects.filter((condition) => condition.id !== '');
      if (conditions.length === 0) return;

      const actions = conditions.map((condition) => {
        const actionTypeName = `${coreModule.api.Utils.i18n(tah.actions[actionType])}: ` ?? '';
        let info1 = '';
        let icon1 = ' ';
        let cssClass = 'toggle';

        if (this.actor) {
          const effect = this.actor.effects.find(effect => effect.statuses.some(status => status === condition.id) && !effect?.disabled);
          const active = effect ? ' active' : '';
          info1 = this.#getConditionInfo(condition, effect);
          icon1 = this.#getConditionIcon(condition, effect);
          cssClass = `toggle${active}`;
        }

        return {
          id: condition.id,
          name: game.i18n.localize(condition.label) ?? game.i18n.localize(condition.name),
          img: coreModule.api.Utils.getImage(condition),
          cssClass,
          listName: `${actionTypeName}${name}`,
          tooltip: this.#getConditionTooltipData(condition.id),
          info1,
          icon1,
          onClick: async () => {
            for (const actor of this.actors) {
              if (condition.system.condition.value == null) {
                if (actor.hasCondition(condition.id))
                  await actor.removeCondition(condition.id)
                else
                  await actor.addCondition(condition.id)
              } else {
                if (this.isRightClick)
                  await actor.removeCondition(condition.id)
                else
                  await actor.addCondition(condition.id)
              }
            }

            return Hooks.callAll('forceUpdateTokenActionHud');
          }
        }
      });

      const groupData = {id: 'conditions', type: 'system'}
      return this.addActions(actions, groupData)
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

        switch (type) {
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
          case 'forien-armoury.scroll':
          case 'forien-armoury.grimoire':
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
          icon1: '<i class="fas fa-box-open></i>',
          settings: {
            image: coreModule.api.Utils.getImage(item),
            style: 'tab'
          },
          info2: {
            class: '',
            text: this.#getItemValue(item),
            title: this.#getItemValueTooltip(item)
          }
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
          case 'forien-armoury.scroll':
          case 'forien-armoury.grimoire':
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
      const combat = await this.#buildUtilityCombat();
      const char = await this.#buildUtilityCharacter();
      const token = await this.#buildUtilityToken();
      const actionType = 'utility';
      const actionData = {...combat, ...char, ...token};

      for (let group in actionData) {
        const types = actionData[group];
        const actions = Object.values(types).map(action => {
          const id = action.id;
          const name = action.name;
          const onClick = action.onClick;
          const actionTypeName = `${coreModule.api.Utils.i18n(tah.actions[actionType])}: ` ?? '';
          const listName = `${actionTypeName}${name}`;
          const info1 = {};
          let cssClass = '';

          if (id === 'initiative' && game.combat) {
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
            onClick,
            info1,
            cssClass,
            listName
          }
        })

        const groupData = {id: group, type: 'system'}
        await this.addActions(actions, groupData)
      }
    }

    async #buildUtilityCombat() {
      const combatTypes = {
        initiative: {
          id: 'initiative',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.rollInitiative'),
          onClick: async () => {
            for (const actor of this.actors) {
              await actor.rollInitiative({createCombatants: true});
            }

            return Hooks.callAll('forceUpdateTokenActionHud');
          }
        },
        endTurn: {
          id: 'endTurn',
          name: game.i18n.localize('tokenActionHud.endTurn'),
          onClick: () => {
            if (game.combat?.current?.tokenId === this.token?.id)
              return game.combat?.nextTurn();
          }
        },
        increaseAdvantage: {
          id: 'increaseAdvantage',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.increaseAdvantage'),
          onClick: () => {
            for (const actor of this.actors)
              actor.modifyAdvantage(1);
          }
        },
        decreaseAdvantage: {
          id: 'decreaseAdvantage',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.decreaseAdvantage'),
          onClick: () => {
            for (const actor of this.actors)
              actor.modifyAdvantage(-1);
          }
        }
      }

      if (!this.actor || !game.combat || game.combat?.current?.tokenId !== this.token?.id) delete combatTypes.endTurn

      return {'combat': combatTypes};
    }


    async #buildUtilityCharacter() {
      const characterTypes = {
        restRecover: {
          id: 'restRecover',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.restRecover'),
          onClick: async () => {
            for (const actor of this.actors) {
              let skill = actor.itemTypes.skill.find(s => s.name === game.i18n.localize("NAME.Endurance"));
              let options = foundry.utils.mergeObject(testOptions(), {rest: true, tb: actor.characteristics.t.bonus});

              if (skill)
                actor.setupSkill(skill, options).then(setupData => actor.basicTest(setupData));
              else
                actor.setupCharacteristic("t", options).then(setupData => actor.basicTest(setupData))
            }
          }
        },
        incomeRoll: {
          id: 'incomeRoll',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.incomeRoll'),
          onClick: async () => {
            for (const actor of this.actors) {
              const career = actor.currentCareer;
              if (!career) continue;
              const incomeSkill = career.skills[career.incomeSkill[0]];

              if (!incomeSkill || !actor.items.some(i => i.type === 'skill' && i.name === incomeSkill)) {
                ui.notifications.error(game.i18n.localize("SHEET.SkillMissingWarning"));
                continue;
              }

              const options = foundry.utils.mergeObject(testOptions(), {
                title: `${incomeSkill} - ${game.i18n.localize("Income")}`,
                income: actor.details.status,
                career: career.toObject()
              });

              actor.setupSkill(incomeSkill, options).then(setupData => {actor.basicTest(setupData)});
            }
          }
        },
      }

      if (game.modules.get('forien-armoury')?.active) {
        characterTypes.checkCareer = {
          id: 'checkCareer',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.checkCareer'),
          onClick: () => {
            const api = game.modules.get('forien-armoury')?.api;
            if (!api) return;

            for (const actor of this.actors) {
              api.checkCareers.checkCareer(actor);
            }
          }
        };
        characterTypes.checkEquipment = {
          id: 'checkEquipment',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.checkEquipment'),
          onClick: () => {
            const api = game.modules.get('forien-armoury')?.api;
            if (!api) return;

            for (const actor of this.actors) {
              api.itemRepair.checkInventoryForDamage(actor);
            }
          }
        };
      }

      if (game.user.isGM && (this.actors.length > 1 || this.actor?.type === 'character')) {
        characterTypes.awardXP = {
          id: 'awardXP',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.awardXP.awardXP'),
          onClick: () => awardXP(this.actors)
        }
      }

      return {'character': characterTypes};
    }

    async #buildUtilityToken() {
      const tokenTypes = {}

      if (!this.tokens)
        return tokenTypes;

      if (game.modules.get('item-piles')?.active && game.user.isGM) {
        if (this.token) {
          if (this.token.document.flags && this.token.document.flags['item-piles']?.data.enabled) {
            tokenTypes.makeItemPile = {
              id: 'revertItemPile',
              name: game.i18n.localize('tokenActionHud.wfrp4e.actions.revertItemPile'),
              onClick: () => {
                if (!game.modules.get('item-piles')?.active) return;

                for (const token of this.tokens) {
                  game.itempiles?.API?.revertTokensFromItemPiles([token]);
                }
              }
            };
          } else {
            tokenTypes.makeItemPile = {
              id: 'makeItemPile',
              name: game.i18n.localize('tokenActionHud.wfrp4e.actions.makeItemPile'),
              onClick: () => {
                if (!game.modules.get('item-piles')?.active) return;

                for (const token of this.tokens) {
                  game.itempiles?.API?.turnTokensIntoItemPiles([token]);
                }
              }
            };
          }
        } else {
          tokenTypes.toggleItemPiles = {
            id: 'toggleItemPiles',
            name: game.i18n.localize('tokenActionHud.wfrp4e.actions.toggleItemPiles'),
            onClick: () => {
              if (!game.modules.get('item-piles')?.active) return;

              for (const token of this.tokens) {
                if (token.document.flags['item-piles']?.data.enabled)
                  game.itempiles?.API?.revertTokensFromItemPiles([token]);
                else
                  game.itempiles?.API?.turnTokensIntoItemPiles([token]);
              }
            }
          };
        }
      }

      if (game.user.isGM) {
        tokenTypes.toggleDisposition = {
          id: 'toggleDisposition',
          name: game.i18n.localize('tokenActionHud.wfrp4e.actions.toggleDisposition'),
          onClick: () => {
            const dispositions = Object.values(CONST.TOKEN_DISPOSITIONS);

            for (const token of this.tokens) {
              let disposition = token.document.disposition;
              let index = dispositions.indexOf(disposition);
              index = (index + 1) % dispositions.length
              disposition = dispositions[index];
              token.document.update({disposition});
            }
          }
        }
      }

      return {'token': tokenTypes};
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
    } = {}, values = [], image = true) {
      values = [actionType, item._id, ...values];

      return {
        id: item._id,
        name: this.#getActionName(item.name),
        img: image ? coreModule.api.Utils.getImage(item) : null,
        icon1,
        icon2,
        icon3,
        listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${item.name}`,
        encodedValue: values.join(this.delimiter),
        info1: {
          class: '',
          text: this.#getTestTarget(item),
          title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.TestTarget')
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
            class: '',
            text: this.#getTestTarget(itemData),
            title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.TestTarget')
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

    #getConditionInfo(condition, effect) {
      if (!condition.system.condition.value) return null;

      return {
        class: '',
        text: effect?.system.condition.value ?? '0',
        title: game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ConditionRating')
      }
    }

    #getConditionIcon(condition, effect) {
      if (condition.system.condition.value) return null;
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
        case 'trait':
          if (!itemData.Damage) break;
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
          if (itemData.lore?.value === 'petty') break;
          if (this.#useWomChanneling && itemData.lore?.value && this.#groupLores)
            return `${itemData.cn.value}`;
          else
            return `${itemData.cn.SL}/${itemData.cn.value}`;
        case 'extendedTest':
          return itemData.test.value;
        default:
          return null;
      }
    }

    #getItemValueTooltip(itemData) {
      switch (itemData.type) {
        case 'weapon':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.WeaponDamage');
        case 'trait':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.TraitDamage');
        case 'trapping':
        case 'ammunition':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.Quantity');
        case 'container':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.Encumbrance');
        case 'armour':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.HighestAP');
        case 'spell':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.CN');
        case 'extendedTest':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.Skill');
        default:
          return null;
      }
    }

    #getItemSecondaryValue(itemData) {
      switch (itemData.type) {
        case 'spell':
          return (itemData.Damage > 0 || itemData.magicMissile?.value === true) ? '+' + itemData.Damage : null;
        case 'extendedTest':
          if (itemData.system.hide.progress)
            return null;
          else
            return `${itemData.system.SL.current}/${itemData.system.SL.target}`;
        default:
          return null;
      }
    }

    #getItemSecondaryValueTooltip(itemData) {
      switch (itemData.type) {
        case 'spell':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.SpellDamage');
        case 'extendedTest':
          return game.i18n.localize('tokenActionHud.wfrp4e.tooltips.ExtendedTestTarget');
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
          icon1 = (item.system.isEquipped) ? iconWeaponEquipped : null;
          if (this.#isWeaponLoadable(item))
            icon2 = this.#isWeaponLoaded(item) ? iconWeaponLoaded : iconWeaponNotLoaded;
          break;
        case 'forien-armoury.grimoire':
          icon1 = (item.system.isEquipped) ? iconWeaponEquipped : null;
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