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
    default: true,
    onChange: (value) => {
      coreUpdate(value)
    }
  })
}