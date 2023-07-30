# FoundryVTT - Forien's Easy Polls
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/forien/foundryvtt-forien-easy-polls?style=for-the-badge) 
![GitHub Releases](https://img.shields.io/github/downloads/Forien/foundryvtt-forien-easy-polls/latest/module.zip?style=for-the-badge) 
![GitHub All Releases](https://img.shields.io/github/downloads/Forien/foundryvtt-forien-easy-polls/module.zip?style=for-the-badge&label=Downloads+total)    
**[Compatibility]**: *FoundryVTT* 0.6.0+ (verified working on v11)  
**[Systems]**: *any*  
**[Languages]**: *English, Polish*  

This module aims to provide solution to create, manage, vote and see results of Polls in Chat Log during games played via Foundry Virtual Tabletop.

## Usage

This module lets you create and manage Polls using [Chat Command](#through-chat-command), [Create Poll Dialog](#through-create-dialog-ui) and [Saved Polls App](#saved-polls)

### Through Chat Command
To create a poll, use `/poll` chat command. 
* First line becomes the question.
* Every other line becomes an answer. 
* Empty lines are ignored

_Tip_: Use `Shift+Enter` to go to new line when writing a message


#### Optional flags

Chat Command supports the following optional flags. Flags allow overriding the default [Configuration Settings](#configuration)

##### Mode
Use this flag by typing `--mode` or `--m` directly followed by one of allowed modes:
* `multiple` (also `multi`, `m`) — set Poll to multiple vote poll, allowing players to vote on multiple options
* `single` (also `s`) — set Poll to single vote poll, allowing players to only pick one option

##### Results
Use this flag by typing `--results` or `--r` directly followed by one of allowed settings:
* `true` (also `t`) — set Poll to allow players checking the Poll's results
* `false` (also `f`) — set Poll to hide results from players

##### Secret
Use this flag by typing `--secret` or `--s` directly followed by one of allowed settings:
* `true` (also `t`) — set Poll to allow players seeing who voted for what options (requires players to also see results)
* `false` (also `f`) — set Poll to hide voters

#### Example:
```
/p --mode single Ultimate Question of Life, the Universe, and Everything
Stupid answer
Dumb answer
Just answer
Barely answer
42
¯\_(ツ)_/¯
```

### Through Create Dialog UI

Press `P` (keybinding is editable through Foundry's `Configure Options`) to open a "Create Poll" Dialog, where you can set Poll's Question and Options in visual form.

In this Dialog you can also set all flags as you wish.

![](https://i.imgur.com/edljE6f.png)

### Saved Polls

When using "Creat Poll" Dialog, you have an option to "Create and Save". Using this button will save the Poll for your later use.

Press `Ctrl+P` (keybinding is editable through Foundry's `Configure Options`) to open a "Saved Polls" App, where you can see all your Saved Polls and quickly post them to Chat, delete them, or edit them.

![](https://i.imgur.com/qs1eD1a.png)

## Configuration

In configuration you can set several handy options like:
- Allowing Players to create Polls
- Default flags for newly created Polls

![](https://i.imgur.com/ZgjSU6o.png)

## Screenshots 

![](https://i.gyazo.com/d7b662c2e90a366c14171c8d6e0a3f3b.gif)
![](https://i.imgur.com/x1T35P6.png)

## Future plans

* _none currently_

You can **always** check current and up-to-date [planned and requested features here](https://github.com/Forien/foundryvtt-forien-easy-polls/issues?q=is%3Aopen+is%3Aissue+label%3Aenhancement)

*If you have **any** suggestion or idea on new contents, hit me up on Discord!*

## Translations

If you are interested in translating my module, simply make a new Pull Request with your changes, or contact me on Discord.

## Contact

If you wish to contact me for any reason, reach me out on Discord using my tag: `forien`


## Acknowledgments

* Thanks to Discord member Vathraq for the idea for this module!

## Support

If you wish to support module development, please consider [becoming Patron](https://www.patreon.com/foundryworkshop) or donating [through Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2RRX7HVEMV2&source=url). Thanks!

## License

Forien's Easy Polls is a module for Foundry VTT by Forien and is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License for Package Development from March 2, 2023](https://foundryvtt.com/article/license/).
