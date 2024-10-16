import Utility from "./utility/Utility.mjs";
import {settings} from "./constants.mjs";

export default class GroupAdvantage {
  static actions = {
    batter: {
      cost: 1,
      method: GroupAdvantage.batter,
      name: "tokenActionHud.wfrp4e.actions.advantage.batter"
    },
    trick: {
      cost: 1,
      method: GroupAdvantage.trick,
      name: "tokenActionHud.wfrp4e.actions.advantage.trick"
    },
    additionalEffort: {
      cost: 2,
      method: GroupAdvantage.additionalEffort,
      name: "tokenActionHud.wfrp4e.actions.advantage.additionalEffort"
    },
    fleeFromHarm: {
      cost: 2,
      method: GroupAdvantage.fleeFromHarm,
      name: "tokenActionHud.wfrp4e.actions.advantage.fleeFromHarm"
    },
    additionalAction: {
      cost: 4,
      method: GroupAdvantage.additionalAction,
      name: "tokenActionHud.wfrp4e.actions.advantage.additionalAction"
    }
  }

  /**
   * @param {ActorWfrp4e} actor
   * @returns {Promise<boolean>}
   */
  static async batter(actor) {
    const name = game.i18n.localize(GroupAdvantage.actions.batter.name);
    const test = await actor.setupCharacteristic("s", {
      appendTitle: ` – ${name}`,
      preventAdvantage: true,
      tah: {isBatter: true},
    });
    await GroupAdvantage.postMessage(GroupAdvantage.actions.batter, actor);
    await test.roll();

    return true;
  }

  /**
   * If attacker won Batter, the defender gets Prone.
   * Defender gets 1 Advantage.
   *
   * @param {OpposedTest} opposedTest
   * @param {TestWFRP} attackerTest
   * @param {TestWFRP} defenderTest
   */
  static finishBatter(opposedTest, attackerTest, defenderTest) {
    let message = game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.Batter.DefenderWon");

    if (opposedTest.result.winner === "attacker") {
      defenderTest.actor.addCondition("prone");
      message = game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.Batter.AttackerWon");
    }

    message += " " + game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.Batter.DefenderAdvantage");

    opposedTest.result.other.push(`<p>${message}</p>`);
    defenderTest.actor.modifyAdvantage(1);
  }

  /**
   * @param {ActorWfrp4e} actor
   * @returns {Promise<boolean>}
   */
  static async trick(actor) {
    const name = game.i18n.localize(GroupAdvantage.actions.batter.name);
    const test = await actor.setupCharacteristic("ag", {
      appendTitle: ` – ${name}`,
      preventAdvantage: true,
      tah: {isTrick: true},
    });
    await GroupAdvantage.postMessage(GroupAdvantage.actions.trick, actor);
    await test.roll();

    return true;
  }

  /**
   * Winner of Trick Opposed Test gets an advantage.
   * If Attacker wins, message includes options for Conditions.
   *
   * @param {OpposedTest} opposedTest
   * @param {TestWFRP} attackerTest
   * @param {TestWFRP} defenderTest
   */
  static finishTrick(opposedTest, attackerTest, defenderTest) {
    let message = '';

    if (opposedTest.result.winner === "attacker") {
      attackerTest.actor.modifyAdvantage(1);
      message = game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.Trick.AttackerWon");
    } else {
      message = game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.Trick.DefenderWon");
      defenderTest.actor.modifyAdvantage(1);
    }

    opposedTest.result.other.push(`<p>${message}</p>`);
  }

  /**
   * @param {ActorWfrp4e} actor
   * @returns {Promise<boolean>}
   */
  static async additionalEffort(actor) {
    const action = GroupAdvantage.actions.additionalEffort;
    const advantage = actor.system.status.advantage.value;
    let cost = action.cost;

    cost = await ValueDialog.create(
      {
        text: game.i18n.format("tokenActionHud.wfrp4e.groupAdvantage.AdditionalEffort.DialogText", {
          min: cost,
          max: advantage
        }),
       title: game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.AdditionalEffort.DialogTitle"),
      },
      cost
    );

    if (!cost) return false;

    if (cost > advantage) {
      Utility.notify(game.i18n.format("tokenActionHud.wfrp4e.groupAdvantage.CannotUse", {
        action: game.i18n.localize(action.name),
        advantage,
        cost
      }), {type: "warning"});
      return false;
    }

    if (cost < action.cost) {
      Utility.notify(game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.AdditionalEffort.CantSpendLess"), {type: "warning"});
      return false;
    }

    await GroupAdvantage.postMessage(action, actor);
    const modifier = 10 * (cost - 1);

    const effect = {
      name: "Additional Effort",
      icon: "icons/skills/movement/arrows-up-trio-red.webp",
      duration: {
        rounds: 1
      },
      system: {
        scriptData: [
          {
            label: "Additional Effort",
            script: `args.fields.modifier += ${modifier};`,
            trigger: "dialog",
            options: {
              hideScript: "return false;",
              activateScript: "return true;",
              submissionScript: "this.effect.delete();"
            }
          },
          {
            label: "Prevent Advantage",
            script: "args.test.data.preData.options.preventAdvantage = true;",
            trigger: "preRollTest"
          }
        ]
      }
    }

    await GroupAdvantage.payAdvantage(actor, cost);
    await actor.createEmbeddedDocuments("ActiveEffect", [effect]);

    // we handle spending advantage within this function, so return false
    return false;
  }

  /**
   * @param {ActorWfrp4e} actor
   * @returns {Promise<boolean>}
   */
  static async fleeFromHarm(actor) {
    await GroupAdvantage.postMessage(GroupAdvantage.actions.fleeFromHarm, actor);

    return true;
  }

  /**
   * @param {ActorWfrp4e} actor
   * @returns {Promise<boolean>}
   */
  static async additionalAction(actor) {
    await GroupAdvantage.postMessage(GroupAdvantage.actions.additionalAction, actor);

    const effect = {
      name: "Additional Action",
      icon: "icons/skills/movement/feet-winged-boots-brown.webp",
      duration: {
        rounds: 1
      },
      system: {
        scriptData: [
          {
            label: "Additional Action",
            script: `args.fields.modifier += 0;`,
            trigger: "dialog",
            options: {
              hideScript: "return false;",
              activateScript: "return true;",
              submissionScript: "this.effect.delete();"
            }
          },
          {
            label: "Prevent Advantage",
            script: "args.test.data.preData.options.preventAdvantage = true;",
            trigger: "preRollTest"
          }
        ]
      }
    }

    await actor.createEmbeddedDocuments("ActiveEffect", [effect]);

    return true;
  }

  /**
   * @param {ActorWfrp4e} actor
   * @param {number} value
   *
   * @returns {Promise<ActorWfrp4e>}
   */
  static async payAdvantage(actor, value) {
    return await actor.modifyAdvantage(-value);
  }

  /**
   * Check if it is possible for given actor to use the Group Advantage Action and produce warning if not.
   * Warning can be disabled by passing "silent" argument.
   *
   * @param {ActorWfrp4e} actor
   * @param {{cost: number, method: function, name: string}} action
   * @param {boolean} silent
   *
   * @returns {boolean}
   */
  static canUse(actor, action, {silent = false} = {}) {
    let advantage = actor?.system.status?.advantage?.value || 0;

    if (advantage >= action.cost)
      return true;

    if (!silent) {
      Utility.notify(game.i18n.format("tokenActionHud.wfrp4e.groupAdvantage.CannotUse", {
        action: game.i18n.localize(action.name),
        advantage,
        cost: action.cost
      }), {type: "warning"});
    }

    return false;
  }

  /**
   * Try to use a specific Group Advantage Action. If used, spend the Advantage.
   *
   * @param {ActorWfrp4e} actor
   * @param {{cost: number, method: function, name: string}} action
   */
  static async tryUse(actor, action) {
    if (!GroupAdvantage.canUse(actor, action))
      return;

    const used = await action.method(actor);

    if (used) {
      await GroupAdvantage.payAdvantage(actor, action.cost);
    }
  }

  /**
   * Check if opposed test was result of using one of the GA actions, if so, finish them up if necessary
   *
   * @param {OpposedTest} opposedTest
   * @param {TestWFRP} attackerTest
   * @param {TestWFRP} defenderTest
   */
  static opposedTestResult(opposedTest, attackerTest, defenderTest) {
    if (!attackerTest.data?.result?.options?.tah) return;

    if (attackerTest.data.result.options.tah.isBatter === true)
      GroupAdvantage.finishBatter(opposedTest, attackerTest, defenderTest);

    if (attackerTest.data.result.options.tah.isTrick === true)
      GroupAdvantage.finishTrick(opposedTest, attackerTest, defenderTest);

  }

  /**
   * Post Message using Up in Arms' content for descriptions and effects.
   *
   * @param {{cost: number, method: function, name: string}} action
   * @param {ActorWfrp4e} actor
   *
   * @returns {Promise<void>}
   */
  static async postMessage(action, actor) {
    if (!Utility.getSetting(settings.advantageDesc)) return;

    let systemAction = game.wfrp4e.config.groupAdvantageActions.find(a => a.name === game.i18n.localize(action.name));

    if (!systemAction)
      return;

    const speaker = ChatMessage.getSpeaker({actor});
    await ChatMessage.create({
      flavor: game.i18n.localize("tokenActionHud.wfrp4e.groupAdvantage.GroupAdvantage"),
      speaker,
      content: `
          <h3>${systemAction.name}</h3>
          <p>${systemAction.description}</p>
          ${systemAction.effect}
        `
    })
  }
}
