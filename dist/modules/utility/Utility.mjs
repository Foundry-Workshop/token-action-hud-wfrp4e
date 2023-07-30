import {constants} from '../constants.mjs';

export default class Utility {
  static notify(notification, {type = 'info', permanent = false, consoleOnly = false} = {}) {
    // brand colour: '#3e1395' is too dark for dark mode console;
    const purple = 'purple';
    let colour;

    switch (type) {
      case 'error':
        colour = '#aa2222';
        break;
      case 'warning':
        colour = '#aaaa22';
        break;
      case 'info':
      default:
        colour = '#22aa22';
    }

    console.log(`🦊 %c${constants.moduleLabel}: %c${notification}`, 'color: purple', `color: ${colour}`);

    if (!consoleOnly)
      ui?.notifications?.notify(notification, type, {permanent: permanent, console: false});
  }

  static getTemplate(template) {
    return `modules/${constants.moduleId}/templates/${template}`;
  }

  static async preloadTemplates(templates = []) {
    Utility.notify("Preloading Templates.", {consoleOnly: true})

    templates = templates.map(Utility.getTemplate);
    loadTemplates(templates).then(() => {
      Utility.notify("Templates preloaded.", {consoleOnly: true})
    });
  }

  /**
   * Get setting
   * @param {string} key               The key
   * @param {string|null} defaultValue The default value
   * @returns {string}                 The setting value
   */
  static getSetting (key, defaultValue = null) {
    let value = defaultValue ?? null
    try {
      value = game.settings.get(constants.moduleId, key)
    } catch {
      this.notify(`Setting '${key}' not found`, {type:'error', consoleOnly:true});
    }
    return value
  }

  /**
   * Set setting
   * @param {string} key   The key
   * @param {string} value The value
   */
  static async setSetting (key, value) {
    try {
      value = await game.settings.set(constants.moduleId, key, value)
      this.notify(`Setting '${key}' set to '${value}'`, {type:'info', consoleOnly:true});
    } catch {
      this.notify(`Setting '${key}' not found`, {type:'error', consoleOnly:true});
    }
  }
}