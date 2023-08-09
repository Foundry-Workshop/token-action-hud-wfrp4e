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
    async doHandleActionEvent(event, encodedValue) {
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
        return this.doRenderItem(this.actor, actionId);
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
     * @param {object} event         The event
     * @param {object} actor         The actor
     * @param {object} token         The token
     * @param {string} actionTypeId  The action type id
     * @param {string} actionId      The actionId
     * @param {string} subActionType The sub action type id
     * @param {string} subActionId   The sub actionId
     */
    async #handleAction(event, actor, token, actionTypeId, actionId, subActionType, subActionId) {
      switch (actionTypeId) {
        case 'characteristic':
          return this.#handleCharacteristicAction(actor, actionId);
        case 'skill':
        case 'talent':
        case 'item':
        case 'magic':
          return this.#handleItemAction(actor, actionId);
        case 'combatBasic':
          return this.#handleCombatAction(actor, actionId);
        case 'combatWeapon':
        case 'combatTrait':
          return this.#handleCombatItemAction(actor, actionId);
        case 'consumable':
          return this.#handleCombatConsumableAction(actor, actionId, subActionType, subActionId);
        case 'condition':
          return this.#handleConditionAction(event, actor, actionId);
        case 'utility':
          return this.#handleUtilityAction(token, actor, actionId);
      }
    }

    #handleCharacteristicAction(actor, actionId) {
      return actor.setupCharacteristic(actionId).then(test => test.roll());
    }

    /**
     * Handle item action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleItemAction(actor, actionId) {
      const item = actor.items.get(actionId);

      switch (item.type) {
        case 'skill':
          return actor.setupSkill(item).then(test => test.roll());
        case 'weapon':
          return this.#rollWeapon(actor, item);
        case 'spell':
          return actor.sheet.spellDialog(item);
        case 'prayer':
          return actor.setupPrayer(item).then(setupData => actor.prayerTest(setupData));
        case 'trait':
          return this.#handleRollableTrait(actor, item);
        default:
          item.postItem(0);
      }
    }

    async #handleCombatAction(actor, actionId) {
      switch (actionId) {
        case 'unarmed':
          let unarmed = game.wfrp4e.config.systemItems.unarmed
          return actor.setupWeapon(unarmed).then(setupData => {
            actor.weaponTest(setupData)
          })
        case 'dodge':
          return actor.setupSkill(game.i18n.localize("NAME.Dodge")).then(setupData => {
            actor.basicTest(setupData)
          });
        case 'improv':
          let improv = game.wfrp4e.config.systemItems.improv;
          return actor.setupWeapon(improv).then(setupData => {
            actor.weaponTest(setupData)
          })
        case 'stomp':
          let stomp = game.wfrp4e.config.systemItems.stomp;
          return actor.setupTrait(stomp).then(setupData => {
            actor.traitTest(setupData)
          })
        default:
          break;
      }
    }

    async #handleCombatItemAction(actor, actionId) {
      const item = actor.items.get(actionId);

      switch (item.type) {
        case 'trait':
          return this.#handleRollableTrait(actor, item);
        case 'weapon':
          return this.#rollWeapon(actor, item);
        case 'consumable':
        default:
      }
    }

    #handleRollableTrait(actor, item) {
      if (item.rollable?.value) {
        return actor.setupTrait(item).then(setupData => {
          actor.traitTest(setupData)
        })
      }

      return item.postItem(0);
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

      if (condition.flags.wfrp4e.value == null) {
        if (this.actor.hasCondition(actionId))
          await this.actor.removeCondition(actionId)
        else
          await this.actor.addCondition(actionId)
      } else {
        if (this.isRightClick(event))
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
    async #handleUtilityAction(token, actor,  actionId) {
      switch (actionId) {
        case 'endTurn':
          return this.#endTurn(token);
        case 'initiative':
          return this.#rollInitiative(actor);
        case 'restRecover':
          return this.#restRecover(actor);
        case 'incomeRoll':
          return this.#incomeRoll(actor);
        case 'checkCareer':
          return this.#checkCareer(actor);
        case 'checkEquipment':
          return this.#checkEquipment(actor);
        case 'makeItemPile':
          return this.#makeItemPile(token);
        case 'revertItemPile':
          return this.#makeItemPile(token, false);
      }
    }

    async #endTurn(token) {
      if (game.combat?.current?.tokenId === token.id)
        return await game.combat?.nextTurn();
    }

    async #rollInitiative(actor) {
      if (!actor) return;
      await actor.rollInitiative({createCombatants: true});

      return Hooks.callAll('forceUpdateTokenActionHud');
    }

    async #restRecover(actor) {
      let skill = actor.getItemTypes("skill").find(s => s.name === game.i18n.localize("NAME.Endurance"));
      let options = {rest: true, tb: actor.characteristics.t.bonus}
      let setupData;
      if (skill)
        setupData = await actor.setupSkill(skill, options);
      else
        setupData = await actor.setupCharacteristic("t", options)

      return actor.basicTest(setupData)
    }

    async #incomeRoll(actor) {
      const career = actor.currentCareer;
      if (!career) return;
      const incomeSkill = career.skills[career.incomeSkill[0]];

      if (!incomeSkill || !actor.items.some(i => i.type === 'skill' && i.name === incomeSkill))
        return ui.notifications.error(game.i18n.localize("SHEET.SkillMissingWarning"));

      let options = {
        title: `${incomeSkill} - ${game.i18n.localize("Income")}`,
        income: actor.details.status,
        career: career.toObject()
      };
      let setupData = await actor.setupSkill(incomeSkill, options);
      return actor.basicTest(setupData)
    }

    async #checkEquipment(actor) {
      const api = game.modules.get('forien-armoury')?.api
      if (!api) return;

      return api.itemRepair.checkInventoryForDamage(actor);
    }

    async #checkCareer(actor) {
      const api = game.modules.get('forien-armoury')?.api
      if (!api) return;

      return api.checkCareers.checkCareer(actor);
    }

    async #makeItemPile(token, activate = true) {
      if (!game.modules.get('item-piles')?.active) return;
      if (activate)
        return game.itempiles?.API?.turnTokensIntoItemPiles([token])

      return game.itempiles?.API?.revertTokensFromItemPiles([token])
    }

    #rollWeapon(actor, item) {
      return actor.setupWeapon(item).then(setupData => {
        if (!setupData.abort)
          actor.weaponTest(setupData);
      });
    }
  }
})