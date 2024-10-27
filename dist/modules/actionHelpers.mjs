import Utility from "./utility/Utility.mjs";
import {settings} from "./constants.mjs";

export function testOptions() {
  let options = {};

  if (pressedShift()) {
    options.fields = {
      rollMode: Utility.getSetting(settings.shiftRollMode)
    }
  }

  let bypass = Utility.getSetting(settings.bypassDefault);

  if (pressedAlt())
    bypass = !bypass;

  options.bypass = bypass;

  return options;
}


export function pressedAlt() {
  return game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.ALT);
}

export function pressedShift() {
  return game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.SHIFT);
}

export function pressedControl() {
  return game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL);
}