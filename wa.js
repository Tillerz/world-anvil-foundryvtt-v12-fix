import WorldAnvil from "./module/api.js";
import WorldAnvilConfig from "./module/config.js";
import WorldAnvilBrowser from "./module/journal.js";
import WorldAnvilPageNames from "./module/pagenames.js";
import * as api from "./module/framework.js";

let module = undefined;

/**
 * Initialization actions taken on Foundry Virtual Tabletop client init.
 */
Hooks.once("init", () => {
  module = game.modules.get("world-anvil");

  // Register settings menu
  WorldAnvilConfig.registerSettings();

  /**
   * A singleton instance of the WorldAnvil client
   * @type {WorldAnvil}
   */
  module.anvil = new WorldAnvil();

  /**
   * A singleton instance of the WorldAnvilBrowser UI for importing content
   * @type {WorldAnvilBrowser}
   */
  module.browser = new WorldAnvilBrowser();

  /**
   * A singleton instance of the WorldAnvilConfig UI for configuring account integration
   * @type {WorldAnvilConfig}
   */
  module.config = new WorldAnvilConfig();

  // Register some helper functions
  module.api = api;

  /**
   * A singleton instance of WorldAnvilPageNames for looking up configured page names
   * @type {WorldAnvilPageNames}
   */
  module.pageNames = new WorldAnvilPageNames();
});


/* -------------------------------------------- */


/**
 * Initialization actions taken once data sources are ready
 */
Hooks.once("ready", () => {
  if ( !game.user.isGM ) return;
  return module.anvil.connect();
});


/* -------------------------------------------- */


/**
 * Add the World Anvil configuration button to the Journal Directory
 */
Hooks.on("renderJournalDirectory", (app, html, data) => {
  if ( !game.user.isGM ) return;

  // Add the World Anvil Button
  const button = document.createElement("button");
  button.type = "button";
  button.id = "world-anvil";
  button.innerHTML = `<img src="modules/world-anvil/icons/wa-icon.svg" title="${game.i18n.localize("WA.SidebarButton")}"/>`;
  button.addEventListener("click", () => {
    const anvil = game.modules.get("world-anvil").anvil;
    if ( anvil.worldId ) {
      module.browser.render({force: true});
    } else {
      module.config.render({force: true});
    }
  });
  html.querySelector(".directory-header .action-buttons")?.append(button);

  // Re-render the browser if it's already open
  module.browser.render();
});


/* -------------------------------------------- */


/**
 * Augment rendered Journal sheets to add WorldAnvil content
 */
Hooks.on("renderJournalSheet", (app, html, data) => {

  // Get the rendered Journal entry (app.document in v13+, app.object in legacy)
  const entry = app.document ?? app.object;
  const articleId = entry.getFlag("world-anvil", "articleId");
  if ( !articleId ) return;

  const titleEl = html.querySelector(".window-title");
  if ( titleEl ) {

    // Add header button to re-sync (GM Only)
    if ( game.user.isGM ) {
      html.classList.add("world-anvil");
      const sync = document.createElement("a");
      sync.className = "wa-sync";
      sync.innerHTML = `<i class="fas fa-sync"></i>${game.i18n.localize("WA.Sync")}`;
      sync.addEventListener("click", event => {
        event.preventDefault();
        return api.importArticle(articleId);
      });
      titleEl.after(sync);
    }

    // Add WA shortcut on header
    const publicArticleLink = game.settings.get("world-anvil", "publicArticleLinks");
    const articleURL = entry.getFlag("world-anvil", "articleURL");
    if ( articleURL && (game.user.isGM || publicArticleLink) ) {
      const link = document.createElement("a");
      link.id = "wa-external-link";
      link.href = articleURL;
      link.innerHTML = `<i class="fas fa-external-link-alt"></i>${game.i18n.localize("WA.OnWA")}`;
      titleEl.after(link);
    }
  }
});

Hooks.on("renderJournalPageSheet", (app, html, data) => {

  // Activate cross-link listeners
  html.querySelectorAll(".wa-link").forEach(el => {
    el.addEventListener("click", event => {
      event.preventDefault();
      const articleId = event.currentTarget.dataset.articleId;

      // View an existing linked article (OBSERVER+)
      const entry = game.journal.find(e => e.getFlag("world-anvil", "articleId") === articleId);
      if ( entry ) {
        if ( !entry.testUserPermission(game.user, "OBSERVER") ) {
          return ui.notifications.warn(game.i18n.localize("WA.NoPermissionView"));
        }
        return entry.sheet.render({force: true});
      }

      // Import a new article (GM Only)
      if ( !game.user.isGM ) {
        return ui.notifications.warn(game.i18n.localize("WA.NoPermissionView"));
      }
      return api.importArticle(articleId, {renderSheet: true});
    });
  });
});
