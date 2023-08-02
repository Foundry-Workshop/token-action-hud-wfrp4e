import {constants, settings} from './constants.mjs';

/**
 *
 * @param coreUpdate
 */
export default function registerSettings() {

}
export function registerSettingsCoreUpdate(coreUpdate) {
  game.settings.register(constants.moduleId, settings.displayUnequipped, {
    name: game.i18n.localize('tokenActionHud.wfrp4e.settings.displayUnequipped.name'),
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.displayUnequipped.hint'
    ),
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
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupLores.hint'
    ),
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
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.groupTrappings.hint'
    ),
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
    hint: game.i18n.localize('tokenActionHud.wfrp4e.settings.maxCharacters.hint'
    ),
    scope: 'client',
    config: true,
    type: Number,
    default: 0,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
}