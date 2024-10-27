import GroupAdvantage from "./GroupAdvantage.js";
import {pressedAlt, pressedControl, pressedShift, testOptions} from "./actionHelpers.mjs";

export let RollHandlerWfrp4e = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
  /**
   * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
   * @extends RollHandler
   */
  RollHandlerWfrp4e = class RollHandlerWfrp4e extends coreModule.api.RollHandler {
    /**
     * Handle action event
     * Called by Token Action HUD Core when an action event is triggered
     * @override
     * @param {object} event        The event
     * @param {string} encodedValue The encoded value
     */
    async handleActionClick(event, encodedValue) {
      const payload = encodedValue.split('|');
      if (payload.length < 2) {
        super.throwInvalidValueErr();
      }

      const actionTypeId = payload[0];
      const actionId = payload[1];
      const subActionType = payload[2] ?? null;
      const subActionId = payload[3] ?? null;

      const renderable = ['item', 'magic', 'skill', 'talent'];

      if (renderable.includes(actionTypeId) && this.isRenderItem()) {
        return this.renderItem(this.actor, actionId);
      }

      const knownCharacters = ['character', 'creature', 'npc'];

      // If single actor is selected
      if (this.actor) {
        return await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId, subActionType, subActionId);
      }

      const controlledTokens = canvas.tokens.controlled.filter((token) => knownCharacters.includes(token.actor?.type));

      // If multiple actors are selected
      for (const token of controlledTokens) {
        const actor = token.actor;
        await this.#handleAction(event, actor, token, actionTypeId, actionId);
      }
    }

    /**
     * Handle action
     * @private
     * @param {object} event              The event
     * @param {object} actor              The actor
     * @param {object} token              The token
     * @param {string} actionTypeId       The action type id
     * @param {string} actionId           The actionId
     * @param {string|null} subActionType The sub action type id
     * @param {string|null} subActionId   The sub actionId
     */
    async #handleAction(event, actor, token, actionTypeId, actionId, subActionType = null, subActionId = null) {
      switch (actionTypeId) {
        case 'characteristic':
          return this.#handleCharacteristicAction(actor, actionId);
        case 'skill':
        case 'extendedTest':
        case 'talent':
        case 'item':
        case 'magic':
          return this.#handleItemAction(actor, actionId);
        case 'combatAdvantage':
          return this.#handleCombatAdvantage(event, actor, actionId);
        case 'combatArmour':
          return this.#handleCombatArmour(event, actor, actionId);
        case 'combatBasic':
          return this.#handleCombatAction(actor, actionId);
        case 'combatWeapon':
        case 'combatTrait':
          return this.#handleCombatItemAction(event, actor, actionId);
        case 'consumable':
          return this.#handleCombatConsumableAction(actor, actionId, subActionType, subActionId);
        case 'manualEffect':
          return this.#handleManualEffectAction(event, actor, subActionType, subActionId);
        case 'testIndependentEffect':
            return this.#handletestIndependentEffectAction(event, actor, subActionType, subActionId);
        case 'condition':
          return this.#handleConditionAction(event, actor, actionId);
        case 'utility':
          return this.#handleUtilityAction(token, actor, actionId);
      }
    }

    #handleCharacteristicAction(actor, actionId) {
      return actor.setupCharacteristic(actionId, this.options).then(test => test.roll());
    }

    /**
     * Handle item action
     * @private
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleItemAction(actor, actionId) {
      const item = actor.items.get(actionId);

      switch (item.type) {
        case 'skill':
          return actor.setupSkill(item, this.options).then(test => test.roll());
        case 'weapon':
          return this.#rollWeapon(actor, item);
        case 'spell':
          return actor.sheet.spellDialog(item, this.options);
        case 'prayer':
          return actor.setupPrayer(item, this.options).then(setupData => actor.prayerTest(setupData));
        case 'trait':
          return this.#handleRollableTrait(actor, item);
        case 'extendedTest':
          return actor.setupExtendedTest(item, this.options);
        case 'forien-armoury.scroll':
          return item.system.prepareScrollTest(this.options);
        default:
          item.postItem(0);
      }
    }

    async #handleCombatAction(actor, actionId) {
      switch (actionId) {
        case 'unarmed':
          let unarmed = game.wfrp4e.config.systemItems.unarmed
          return actor.setupWeapon(unarmed, this.options).then(setupData => {
            actor.weaponTest(setupData)
          })
        case 'dodge':
          return actor.setupSkill(game.i18n.localize("NAME.Dodge"), this.options).then(setupData => {
            actor.basicTest(setupData)
          });
        case 'improv':
          let improv = game.wfrp4e.config.systemItems.improv;
          return actor.setupWeapon(improv, this.options).then(setupData => {
            actor.weaponTest(setupData)
          })
        case 'stomp':
          let stomp = game.wfrp4e.config.systemItems.stomp;
          return actor.setupTrait(stomp, this.options).then(setupData => {
            actor.traitTest(setupData)
          })
        default:
          break;
      }
    }

    #handleCombatAdvantage(event, actor, actionId) {
      const action = GroupAdvantage.actions[actionId];
      if (!action) return;

      GroupAdvantage.tryUse(actor, action);
    }

    #handleCombatArmour(event, actor, actionId) {
      let item, damage;

      if (!this.pressedControl) return;

      if (this.isRightClick) {
        damage = 1;
        item = actor.itemTypes.armour.find(a =>
          a.system.AP[actionId] > 0 &&
          a.system.APdamage[actionId] < a.system.AP[actionId]
        );
      } else {
        damage = -1;
        item = actor.itemTypes.armour.find(a =>
          a.system.AP[actionId] > 0 &&
          a.system.APdamage[actionId] > 0
        );
      }

      if (!item) return;

      return item.system.damageItem(damage, [actionId]);
    }

    async #handleCombatItemAction(event, actor, actionId) {
      const item = actor.items.get(actionId);

      switch (item.type) {
        case 'trait':
          return this.#handleRollableTrait(actor, item);
        case 'weapon':
          if (this.pressedControl)
            return this.#handleWeaponDamage(event, actor, item);
          else if (this.isRightClick)
            return this.renderItem(actor, actionId);
          else
            return this.#rollWeapon(actor, item);
        case 'forien-armoury.grimoire':
          if (this.isRightClick)
            return this.renderItem(actor, actionId);
          else
            this.#handleCombatAction(actor, 'improv');
          break;
        case 'consumable':
        default:
      }
    }

    #handleRollableTrait(actor, item) {
      if (item.rollable?.value) {
        return actor.setupTrait(item, this.options).then(setupData => {
          actor.traitTest(setupData)
        })
      }

      return item.postItem(0);
    }

    async #handletestIndependentEffectAction(event, actor, subActionType, subActionId) {
      let effect = await fromUuid(subActionType);

      if (this.isRightClick) {
        return this.renderItem(actor, effect.item._id);
      }

      if (effect.isTargetApplied) {
        let applyData = {};
        let targets = Array.from(game.user.targets).map(t => t.actor);
        if (!(await effect.runPreApplyScript({targets}))) {
          return
        }
        game.user.updateTokenTargets([]);
        game.user.broadcastActivity({ targets: [] });

        for (let target of targets) {
          applyData = { effectData: [effect.convertToApplied(null, target)] }
          await target.applyEffect(applyData);
        }
      }
      else if (effect.isAreaApplied) {
        if (!(await effect.runPreApplyScript())) {
          return
        }
        let template = await AreaTemplate.fromEffect(subActionType)
        await template.drawPreview(event);
      }
    }

    async #handleManualEffectAction(event, actor, subActionType, subActionId) {
      let effect = await fromUuid(subActionType);

      if (this.isRightClick) {
        return this.renderItem(actor, effect.item._id);
      }

      let script = effect.manualScripts[subActionId];
      script.execute({actor: actor});
    }

    async #handleCombatConsumableAction(actor, actionId, subActionType, subActionId) {
      switch (subActionType) {
        case 'invokable':
          return game.wfrp4e.utility.invokeEffect(actor, subActionId, actionId)
        case 'targetable':
          let effect = actor.populateEffect(subActionId, actionId)
          let item = actor.items.get(actionId)

          if (effect.flags.wfrp4e?.reduceQuantity && game.user.targets.size > 0) {
            if (item.quantity.value > 0)
              item.update({"system.quantity.value": item.quantity.value - 1})
            else
              throw ui.notifications.error(game.i18n.localize("EFFECT.QuantityError"))
          }

          if ((item.range && item.range.value.toLowerCase() === game.i18n.localize("You").toLowerCase())
            && (item.target && item.target.value.toLowerCase() === game.i18n.localize("You").toLowerCase()))
            return await game.wfrp4e.utility.applyEffectToTarget(effect, [{actor: this.actor}]) // Apply to caster (self)
          return await game.wfrp4e.utility.applyEffectToTarget(effect)
        default:
      }
    }

    async #handleConditionAction(event, actor, actionId) {
      const condition = game.wfrp4e.config.statusEffects.find(e => e.id === actionId);

      if (condition.system.condition.value == null) {
        if (this.actor.hasCondition(actionId))
          await this.actor.removeCondition(actionId)
        else
          await this.actor.addCondition(actionId)
      } else {
        if (this.isRightClick)
          await this.actor.removeCondition(actionId)
        else
          await this.actor.addCondition(actionId)
      }

      return Hooks.callAll('forceUpdateTokenActionHud');
    }

    /**
     * Handle utility action
     * @private
     * @param {object}      token    The token
     * @param {ActorWfrp4e} actor    The actor
     * @param {string}      actionId The action id
     */
    async #handleUtilityAction(token, actor, actionId) {

    }

    #handleWeaponDamage(event, actor, item) {
      const damage = this.isRightClick ? 1 : -1;

      return item.system.damageItem(damage);
    }

    #rollWeapon(actor, item) {
      return actor.setupWeapon(item, this.options).then(setupData => {
        if (!setupData.abort)
          actor.weaponTest(setupData);
      });
    }

    get options() {
      return testOptions()
    }

    get pressedAlt() {
      return pressedAlt();
    }

    get pressedShift() {
      return pressedShift();
    }

    get pressedControl() {
      return pressedControl();
    }
  }
})