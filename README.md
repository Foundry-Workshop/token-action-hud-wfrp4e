# FoundryVTT - Token Action HUD WFRP 4e
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/Foundry-Workshop/token-action-hud-wfrp4e?style=for-the-badge)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FFoundry-Workshop%2Ftoken-action-hud-wfrp4e%2Fmaster%2Fdist%2Fmodule.json&label=Foundry%20Min%20Version&query=$.compatibility.minimum&colorB=orange&style=for-the-badge)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FFoundry-Workshop%2Ftoken-action-hud-wfrp4e%2Fmaster%2Fdist%2Fmodule.json&label=Foundry%20Verified&query=$.compatibility.verified&colorB=orange&style=for-the-badge)  
![License](https://img.shields.io/github/license/Foundry-Workshop/token-action-hud-wfrp4e?style=for-the-badge) ![GitHub Releases](https://img.shields.io/github/downloads/Foundry-Workshop/token-action-hud-wfrp4e/latest/module.zip?style=for-the-badge)
![GitHub All Releases](https://img.shields.io/github/downloads/Foundry-Workshop/token-action-hud-wfrp4e/module.zip?style=for-the-badge&label=Downloads+total)  
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white&link=https%3A%2F%2Fdiscord.gg%2FXkTFv8DRDc)](https://discord.gg/XkTFv8DRDc)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/foundryworkshop)
[![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/forien)

Token Action HUD WFRP4e is a repositionable HUD of actions for a selected token prepared specially for the WFRP4e system.

![Token Action HUD](https://raw.githubusercontent.com/Foundry-Workshop/token-action-hud-wfrp4e/master/.github/assets/module-preview.gif)

## Features
- Make rolls directly from the HUD instead of opening your character sheet.
- Use items from the HUD or right-click an action to open a context menu with quick access to item sheets.
- Hover over Talents and Spells to read their description without opening the item sheet.
- Fix and Damage your Armour and Weapons.
- Easily trigger Manual Effect Scripts.
- Make quick Blind GM rolls.
- Use Group Advantage Actions.
- Move the HUD and choose to expand the menus up or down.
- Unlock the HUD to customise layout and groups per user, and actions per actor.
- Add your own macros, journal entries and roll table compendiums.

## Required Modules

**IMPORTANT** — Token Action HUD WFRP 4e requires the [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core) module to be installed.

**Required Core version:**
- TAH WFRP4e v9.5.0 and newer: Core v2.1
- TAH WFRP4e v3.0.0 - v9.4.1: Core v2.0
- TAH WFRP4e v0.0.12 – v2.1.2: Core v1.5
- TAH WFRP4e v0.0.11 and older: Core v1.4

## Recommended Modules
* Token Action HUD uses the [Color Picker](https://foundryvtt.com/packages/color-picker) library module for its color picker settings.
* Token Action HUD WFRP4e supports several actions from the [Forien's Armoury](https://foundryvtt.com/packages/forien-armoury/) and [Item Piles](https://foundryvtt.com/packages/item-piles) modules

## Usage FAQ

For a guide on using Token Action HUD, go to: [How to Use Token Action HUD](https://github.com/Larkinabout/fvtt-token-action-hud-core/wiki/How-to-Use-Token-Action-HUD).

---
#### Does Right Click do anything?
Yes, Right Click does several things depending on what you are clicking:
* Most action types (Skills, Talents, Spells, Prayers, Inventory, Traits, Extended Tests, Consumables) — opens a context menu with **Open Item Sheet**
* Combat Weapons — opens the Item Sheet directly (no context menu; `Ctrl` + Right Click damages instead)
* Effects (Manual Effects, Test Independent Effects) — opens a context menu with **Open Parent Item Sheet**
* Conditions — removes the Condition (stackable) or toggles it (non-stackable)

For actions that don't have a context menu, Right Click behaves just like Left Click.

---
#### How can I damage or repair weapons and Armour?
This only works on the `Combat` tab.

**Weapons:** hold `Control` and Left Click to repair, or Right Click to damage. Plain Right Click opens the Item Sheet.

**Armour:** hold `Control` and Left Click to repair, or Right Click to damage.  
Armour will be damaged "from top down", as ordered in Character Sheet.

---

#### How can I make test hidden?
When holding `Shift` while triggering any Test from Token Action HUD, it will be forced to be Blind GM Roll.  

This can be changed in Module's Settings.

---

#### How can I bypass Roll Dialog?
By default, all Rolls display Dialog for user.  
When holding `Alt` while triggering any Test from Token Action HUD, it will bypass the Dialog with default options.  

This can be changed in Module's Settings so that bypass is default and `Alt` shows Dialog.

*This works with `Shift` modifier*

---

#### I don't see Group Advantage Actions?
Group Advantage actions require two things in order to work. 

- First, you need to have purchased, installed and enabled the official ["Up in Arms"](https://foundryvtt.com/packages/wfrp4e-up-in-arms) module.
- Second, you need to enable **Use Group Advantage** game setting in the WFRP4e's configuration.

---

For questions, feature requests or bug reports, please open an issue [here](https://github.com/Foundry-Workshop/token-action-hud-wfrp4e/issues).


## Future plans

* Implement Apply-able Traits
* Implement Active Effects

You can **always** check current and up-to-date [planned and requested features here](https://github.com/Foundry-Workshop/token-action-hud-wfrp4e/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)

*If you have **any** suggestion or idea on new contents, hit me up on Discord!*

## Translations

If you are interested in translating my module, simply make a new Pull Request with your changes, or contact me on Discord.


## Support

If you wish to support module development, please consider [becoming a Patron](https://www.patreon.com/foundryworkshop) or donating [through Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2RRX7HVEMV2&source=url). Thanks!

Please also consider [supporting Russell](https://ko-fi.com/larkinabout) ([@Larkinabout](https://github.com/Larkinabout)), the author of the **Token Action HUD Core**, which is the basis of this module!

## Contact

If you wish to contact me for any reason, reach me out on Discord using my tag: `forien`

You can also [join my Discord – Foundry Workshop](https://discord.gg/XkTFv8DRDc).


## Acknowledgments

* Thanks to Russell (@Larkinabout) for creating the [Token Action HUD Core](https://foundryvtt.com/packages/token-action-hud-core)!
* Thank you to the Community Helpers on Foundry's Discord who provide tireless support for people seeking help with the HUD.
* Thanks to Txus for quick reporting of common issues to help me keep this module relatively bug free as fast as possible :)
* Thanks to doumoku for providing Japanese translations
* Thanks to silentmark for providing Polish translations
* Thanks to LeRatierBretonnien for providing French translations

## License

Token Action HUD WFRP4e is a module for Foundry VTT by Forien and is licensed under a [Mozilla Public License v. 2.0](https://github.com/Foundry-Workshop/token-action-hud-wfrp4e/blob/master/LICENSE).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License for Package Development from March 2, 2023](https://foundryvtt.com/article/license/).
