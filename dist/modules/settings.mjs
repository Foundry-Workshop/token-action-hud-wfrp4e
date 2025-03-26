import {constants, settings} from './constants.mjs';

/**
 *
 * @param coreUpdate
 */
export function registerSettingsCoreUpdate(coreUpdate) {
  game.settings.register(constants.moduleId, settings.shiftRollMode, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.shiftRollMode.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.shiftRollMode.hint'),
    scope: 'client',
    config: true,
    type: String,
    default: CONST.DICE_ROLL_MODES.BLIND,
    choices: {
      [CONST.DICE_ROLL_MODES.BLIND]: 'CHAT.RollBlind',
      [CONST.DICE_ROLL_MODES.PRIVATE]: 'CHAT.RollPrivate',
      [CONST.DICE_ROLL_MODES.SELF]: 'CHAT.RollSelf'
    },
    onChange: (value) => {
      coreUpdate(value)
    }
  })
  game.settings.register(constants.moduleId, settings.bypassDefault, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.bypassDefault.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.bypassDefault.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
  game.settings.register(constants.moduleId, settings.magicBehaviour, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.magicBehaviour.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.magicBehaviour.hint'),
    scope: 'client',
    config: true,
    type: String,
    choices: {
      [constants.magicBehaviour.ask]: 'tokenActionHud.wfrp4e.settings.magicBehaviour.ask',
      [constants.magicBehaviour.cast]: 'tokenActionHud.wfrp4e.settings.magicBehaviour.cast',
      [constants.magicBehaviour.channel]: 'tokenActionHud.wfrp4e.settings.magicBehaviour.channel'
    },
    default: constants.magicBehaviour.ask
  })
  game.settings.register(constants.moduleId, settings.advantageDesc, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.advantageDesc.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.advantageDesc.hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  })
  game.settings.register(constants.moduleId, settings.displayUnequipped, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.displayUnequipped.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.displayUnequipped.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
  game.settings.register(constants.moduleId, settings.groupLores, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupLores.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupLores.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
  game.settings.register(constants.moduleId, settings.groupTrappings, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupTrappings.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupTrappings.hint'),
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
  game.settings.register(constants.moduleId, settings.maxCharacters, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.maxCharacters.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.maxCharacters.hint'),
    scope: 'client',
    config: true,
    type: Number,
    default: 0,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
}