/**
 * A configuration sheet to configure the World Anvil integration.
 * Uses the ApplicationV2 API (Foundry v13+).
 */
export default class WorldAnvilConfig extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2
) {

  static DEFAULT_OPTIONS = {
    id: "world-anvil-config",
    tag: "form",
    window: {
      title: "WA.ConfigureMenu",
      icon: "fas fa-user-lock"
    },
    position: {
      width: 600,
      height: "auto"
    },
    form: {
      handler: WorldAnvilConfig._onSubmit,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    main: {
      template: "modules/world-anvil/templates/config.html"
    }
  };

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    const anvil = game.modules.get("world-anvil").anvil;

    let stepNumber = 0;
    let stepLabel = "WA.ConfigureStep3";
    if ( !anvil.user ) {
      stepLabel = "WA.ConfigureStep1";
      stepNumber = 1;
    }
    else if ( !anvil.worldId ) {
      stepLabel = "WA.ConfigureStep2";
      stepNumber = 2;
    }
    else stepNumber = 3;

    if ( anvil.user && !anvil.worlds.length ) await anvil.getWorlds();

    return {
      stepLabel,
      displayWorldChoices: stepNumber >= 2,
      worlds: anvil.worlds.map(w => ({...w, selected: w.id === anvil.worldId})),
      authToken: anvil.authToken
    };
  }

  /* -------------------------------------------- */

  /**
   * Handle form submission. `this` is bound to the application instance.
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async _onSubmit(event, form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    data.authToken = data.authToken.trim();
    await game.settings.set("world-anvil", "configuration", data);
    // Close after step 3 (user authenticated and world selected)
    const anvil = game.modules.get("world-anvil").anvil;
    if ( anvil.user && anvil.worldId ) await this.close();
  }

  /* -------------------------------------------- */

  /**
   * Register game settings and menus for managing the World Anvil integration.
   */
  static registerSettings() {

    game.settings.registerMenu("world-anvil", "config", {
      name: "WA.ConfigureMenu",
      label: "WA.ConfigureLabel",
      hint: "WA.ConfigureHint",
      icon: "fas fa-user-lock",
      type: WorldAnvilConfig,
      restricted: true
    });

    game.settings.register("world-anvil", "configuration", {
      scope: "world",
      config: false,
      default: {},
      type: Object,
      onChange: async c => {
        const anvil = game.modules.get("world-anvil").anvil;
        if ( c.authToken !== anvil.authToken ) await anvil.connect(c.authToken);
        if ( c.worldId !== anvil.worldId ) await anvil.getWorld(c.worldId);
        const app = foundry.applications.instances.get("world-anvil-config");
        if ( app?.rendered ) app.render();
      }
    });

    game.settings.register("world-anvil", "publicArticleLinks", {
      name: "WA.PublicArticleLinksLabel",
      hint: "WA.PublicArticleLinksHint",
      scope: "world",
      type: Boolean,
      default: false,
      config: true
    });

    game.settings.register("world-anvil", "mainArticlePage", {
      name: "WA.JournalPages.ArticleLabel",
      hint: "WA.JournalPages.ArticleHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });

    game.settings.register("world-anvil", "secretsPage", {
      name: "WA.JournalPages.SecretsLabel",
      hint: "WA.JournalPages.SecretsHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });

    game.settings.register("world-anvil", "sideContentPage", {
      name: "WA.JournalPages.SideContentLabel",
      hint: "WA.JournalPages.SideContentHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });

    game.settings.register("world-anvil", "portraitPage", {
      name: "WA.JournalPages.PortraitLabel",
      hint: "WA.JournalPages.PortraitHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });

    game.settings.register("world-anvil", "coverPage", {
      name: "WA.JournalPages.CoverLabel",
      hint: "WA.JournalPages.CoverHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });

    game.settings.register("world-anvil", "relationshipsPage", {
      name: "WA.JournalPages.RelationshipsLabel",
      hint: "WA.JournalPages.RelationshipsHint",
      scope: "world",
      type: String,
      default: "",
      config: true
    });
  }
}
