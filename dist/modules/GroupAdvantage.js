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

  static async batter(actor) {
    const name = game.i18n.localize(GroupAdvantage.actions.batter.name);
    const test = await actor.setupCharacteristic("s", {
      appendTitle: ` – ${name}`,
      producesAdvantage: false,
      tah: {isBatter: true},
    });
    await GroupAdvantage.postMessage(GroupAdvantage.actions.batter, actor);
    await test.roll();

    return true;
  }

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

  static async trick(actor) {
    const name = game.i18n.localize(GroupAdvantage.actions.batter.name);
    const test = await actor.setupCharacteristic("ag", {
      appendTitle: ` – ${name}`,
      producesAdvantage: false,
      tah: {isTrick: true},
    });
    await GroupAdvantage.postMessage(GroupAdvantage.actions.trick, actor);
    await test.roll();

    return true;
  }

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

  static async additionalEffort(actor) {

    return true;
  }

  static async fleeFromHarm(actor) {

    return true;
  }

  static async additionalAction(actor) {

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
   *
   * @param {OpposedTest} opposedTest
   * @param {TestWfrp} attackerTest
   * @param {TestWfrp} defenderTest
   */
  static opposedTestResult(opposedTest, attackerTest, defenderTest) {
    if (!attackerTest.data?.result?.options?.tah) return;

    console.log("opposedTestResult", {opposedTest, attackerTest, defenderTest});

    if (attackerTest.data.result.options.tah.isBatter === true)
      GroupAdvantage.finishBatter(opposedTest, attackerTest, defenderTest);

    if (attackerTest.data.result.options.tah.isTrick === true)
      GroupAdvantage.finishTrick(opposedTest, attackerTest, defenderTest);

  }

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
