const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;

/**
 * @extends ApplicationV2
 * @mixes HandlebarsApplicationMixin
 */
export default class Help extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * @typedef {object} TabDescriptor
   * @property {string} tab                       The tab key.
   * @property {string} label                     The tab label's localization key.
   * @property {string} group                     The tab's group.
   * @property {string} [icon]                    A font-awesome icon.
   * @property {TabCondition} [condition]    A predicate to check before rendering the tab.
   */

  /**
   * @callback TabCondition
   * @param {ClientDocument} doc  The Document instance.
   * @returns {boolean}           Whether to render the tab.
   */

  static DEFAULT_OPTIONS = {
    classes: ["token-action-hud-wfrp4e", "help", "sheet"],
    tabs: {
      default: "cheatsheet",
    },
    min: {
      width: 920,
    },
    position: {
      width: 920,
      height: 600,
    },
    window: {
      title: "tokenActionHud.Help.Title",
      resizable: true,
    },
    actions: {
      settings: this._onSettings,
    },
  };

  static PARTS = {
    header: {template: "modules/token-action-hud-wfrp4e/templates/help/header.hbs"},
    tabs: {template: "templates/generic/tab-navigation.hbs"},
    cheatsheet: {template: "modules/token-action-hud-wfrp4e/templates/help/cheatsheet.hbs"},
    wiki: {template: "modules/token-action-hud-wfrp4e/templates/help/wiki.hbs"},
  };

  static TABS = {
    cheatsheet: {
      id: "cheatsheet",
      group: "primary",
      label: "tokenActionHud.Help.Tabs.Cheatsheet",
      icon: "far fa-rectangle-list",
    },
    wiki: {id: "wiki", group: "primary", label: "tokenActionHud.Help.Tabs.Wiki", icon: "far fa-book-open-reader"},
  };

  static _converter = (() => {
    Object.entries(CONST.SHOWDOWN_OPTIONS).forEach(([k, v]) => showdown.setOption(k, v));
    return new showdown.Converter();
  })();

  /** @override */
  async _preparePartContext(partId, context, options) {
    context.partId = `${this.id}-${partId}`;
    if (context.tabs) {
      context.tab = context.tabs[partId];
    }

    let fn = this[`_prepare${partId.capitalize()}Context`]?.bind(this);
    if (typeof fn == "function") {
      await fn(context, options);
    }

    return context;
  }

  /**
   * @param {object} context
   * @param {object} options
   * @param {string} options.defaultTab
   * @return {TabDescriptor[]|void}
   * @private
   */
  _prepareTabsContext(context, options = {}) {
    if (!this.constructor.TABS)
      return;

    const tabs = {};

    for (let [t, tab] of Object.entries(this.constructor.TABS)) {
      if (tab.condition) {
        switch (foundry.utils.getType(tab.condition)) {
          case "function":
            if (tab.condition() === false) continue;
            break;
          case "boolean":
            if (tab.condition === false) continue;
            break;
        }
      }

      tab.active = this.tabGroups[tab.group] === tab.id;
      tab.cssClass = tab.active ? "active" : "";
      tab.hidden = this.isLimited;

      tabs[t] = tab;
    }

    const defaultTab = options.defaultTab ?? this.options.tabs?.default;
    if (!Object.values(tabs).some(t => t.active) && defaultTab && tabs[defaultTab]) {
      tabs[defaultTab].active = true;
      tabs[defaultTab].cssClass = "active";
      tabs[defaultTab].hidden = false;
    }

    context.tabs = tabs;
  }

  /** @inheritDoc */
  async _renderFrame(options) {
    const frame = await super._renderFrame(options);

    const coreLabel = game.i18n.localize("tokenActionHud.Help.Header.CoreSettings");
    const label = game.i18n.localize("tokenActionHud.Help.Header.Settings");

    frame.querySelector("[data-action=\"close\"]").insertAdjacentHTML("beforebegin", `
        <button type="button" class="header-control fas fa-cog icon" data-action="settings" 
              data-module="token-action-hud-wfrp4e"
              data-tooltip="tokenActionHud.Help.Header.Settings"
              aria-label="${label}"
            ></button>
        <button type="button" class="header-control fas fa-cog icon" data-action="settings" 
              data-module="token-action-hud-core"
              data-tooltip="tokenActionHud.Help.Header.CoreSettings"
              aria-label="${coreLabel}"
            ></button>
      `);

    return frame;
  }

  _onRender(html, options) {
    this.#loadTAHCoreWiki().then((html) => {
      this.element.querySelector("[data-application-part=\"wiki\"]").innerHTML = html;
    });
  }

  _prePosition(position) {
    if (this.options.min?.height && position.height && position.height < this.options.min.height)
      position.height = this.options.min.height;
    else if (this.options.max?.height && position.height && position.height > this.options.max.height)
      position.height = this.options.max.height;

    if (this.options.min?.width && position.width && position.width < this.options.min.width)
      position.width = this.options.min.width;
    else if (this.options.max?.width && position.width && position.width > this.options.max.width)
      position.width = this.options.max.width;

    return position;
  }

  static async render(...args) {
    return (new this()).render(...args);
  }

  async #loadTAHCoreWiki() {
    const response = await fetch("https://raw.githubusercontent.com/wiki/Larkinabout/fvtt-token-action-hud-core/How-to-Use-Token-Action-HUD.md");
    let markdown = await response.text();

    markdown = markdown.replace(/^(#+) (.+)$/gim, "#$1 $2");

    const html = this.constructor._converter.makeHtml(markdown);
    const url = "https://github.com/Larkinabout/fvtt-token-action-hud-core/wiki/How-to-Use-Token-Action-HUD";
    const button = `<a class="button wiki-link" href="${url}" target="_blank">${game.i18n.localize("tokenActionHud.Help.Wiki")} ${url}</a>`

    return button + html;
  }

  static async _onSettings(event) {
    const module = event.target.dataset.module;

    if (game.version.startsWith("12"))
      return await game.settings.sheet.render(true, {activeCategory: module});

    const sheet = await game.settings.sheet.render({force: true});
    sheet.changeTab(module, "categories");
  }
}