# Changelog

## v2.1.1
* Fix displaying unequipped weapons with setting disabled.

## v2.1.0
* Re-added container's `carries` value
* Added support for Test Independent Effects (thanks to silentmark)

## v2.0.0
* Updated for Active Effects using Data Models (with [Warhammer Library](https://foundryvtt.com/packages/warhammer-lib)) and verified for WFRP4e 8.0.1
* Added support for `Grimoires` item type from [Forien's Armoury](https://foundryvtt.com/packages/forien-armoury/) module

## v1.2.1
* Verified for Foundry v12

## v1.2.0
* Added support for Group Advantage actions
  * This feature requires purchased, installed, and activated official ["Up in Arms"](https://foundryvtt.com/packages/wfrp4e-up-in-arms) module.

## v1.1.2
* Hopefully fixed "control" key error on Mac?
* Added missing ManualEffects label to English localization
* Updated Japanese localization (thanks @doumoku!)

## v1.1.1
* Added missing localization string for `Magic Scrolls` group 

## v1.1.0
* Added support for `Scrolls` item type from [Forien's Armoury](https://foundryvtt.com/packages/forien-armoury/) module
* Added new setting for Default Bypass Mode
  * With setting enabled, all Rolls made from Token Action HUD will bypass Dialog by default
  * With setting disabled, all Rolls made from Token Action HUD will show Dialog by default
  * Holding Alt while clicking on a Test, will do the opposite to the setting

## v1.0.1
* Added localization string for new setting

## v1.0.0
* Added French localization (thanks to LeRatierBretonnien for providing translation)
* Added Wounds, Advantage and Channeling SL numbers to group buttons
* Updated and added support for new WFRP4e's Active Effects
  * Added section for Manual Scripts under the Combat tab.
* Added option to damage/repair armour and weapons 
  * While holding Control, Left Click repairs, Right Click damages
* Right clicking on Weapon in Combat tab will now open its Sheet
* Added Shift modifier. While holding Shift, the Roll Mode will be set to Blind GM Roll
  * Roll Mode forced by holding Shift can be changed in Settings


## v0.0.13
* Added Polish localization (thanks to silentmark for providing translation)
* Fixed targetable traits being treated as invokable

## v0.0.12
* Updated code for TAH Core 1.5

## v0.0.11
* Added Japanese localization (thanks to user doumoku for providing translation)

## v0.0.10
* Fixed the Condition names translation for WFRP4e 7.0.0

## v0.0.9
* Removed talent duplicates

## v0.0.8
* Added support for Extended Tests

## v0.0.7
* Added translation keys for tooltips thanks to Txus
* Added support for activatable traits

## v0.0.6
* Tweaked CSS to fix background in the Customization Dialog
* Allowed rendering of actions in talents, skills and magic tabs
* Fixed Prayers not being rollable

## v0.0.5
* Small tweak to CSS
* Updated module preview GIF

## v0.0.4
* Initial release
- Module currently offers: 
  - Fully working rolling of Characteristics, Skills, Spells, Prayers and Weapons
  - Checking and Posting of other Items such as Talents, Traits and Trappings
  - Displays current Armour values
  - Rollable Traits and basic combat actions
  - Basic Character Actions such as Initiative, Income and Rest rolls
  - Way to use apply-able and target-able items