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
      const payload = encodedValue.split('|')

      if (payload.length !== 2) {
        super.throwInvalidValueErr()
      }

      const actionTypeId = payload[0]
      const actionId = payload[1]

      const renderable = ['item']

      if (renderable.includes(actionTypeId) && this.isRenderItem()) {
        return this.doRenderItem(this.actor, actionId)
      }

      const knownCharacters = ['character', 'creature', 'npc'];

      // If single actor is selected
      if (this.actor) {
        await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId)
        return
      }

      const controlledTokens = canvas.tokens.controlled
        .filter((token) => knownCharacters.includes(token.actor?.type))

      // If multiple actors are selected
      for (const token of controlledTokens) {
        const actor = token.actor
        await this.#handleAction(event, actor, token, actionTypeId, actionId)
      }
    }

    /**
     * Handle action
     * @private
     * @param {object} event        The event
     * @param {object} actor        The actor
     * @param {object} token        The token
     * @param {string} actionTypeId The action type id
     * @param {string} actionId     The actionId
     */
    async #handleAction(event, actor, token, actionTypeId, actionId) {
      console.log(event);
      console.log(actionTypeId);
      console.log(actionId);
      switch (actionTypeId) {
        case 'characteristic':
          this.#handleCharacteristicAction(event, actor, actionId);
          break;
        case 'skill':
        case 'talent':
        case 'item':
        case 'magic':
          this.#handleItemAction(event, actor, actionId);
          break;
        case 'combatBasic':
          this.#handleCombatAction(event, actor, actionId);
          break;
        case 'utility':
          this.#handleUtilityAction(token, actionId);
          break;
      }
    }

    #handleCharacteristicAction(event, actor, actionId) {
      return actor.setupCharacteristic(actionId).then(test => test.roll());
    }

    /**
     * Handle item action
     * @private
     * @param {object} event    The event
     * @param {object} actor    The actor
     * @param {string} actionId The action id
     */
    #handleItemAction(event, actor, actionId) {
      const item = actor.items.get(actionId);

      switch (item.type) {
        case 'skill':
          return actor.setupSkill(item).then(test => test.roll());
        case 'weapon':
          return actor.setupWeapon(item).then(setupData => {
            if (!setupData.abort)
              actor.weaponTest(setupData);
          });
        case 'spell':
          return actor.sheet.spellDialog(item);
        default:
          item.postItem(0);
      }
    }

    async #handleCombatAction(event, actor, actionId) {
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
        default:
          break;
      }
    }

    /**
     * Handle utility action
     * @private
     * @param {object} token    The token
     * @param {string} actionId The action id
     */
    async #handleUtilityAction(token, actionId) {
      switch (actionId) {
        case 'endTurn':
          if (game.combat?.current?.tokenId === token.id) {
            await game.combat?.nextTurn()
          }
          break
      }
    }
  }
})