export let RollHandlerWfrp4e = null;

Hooks.once("tokenActionHudCoreApiReady", async (coreModule) => {
  RollHandlerWfrp4e = class RollHandlerWfrp4e extends coreModule.api.RollHandler {};
});
