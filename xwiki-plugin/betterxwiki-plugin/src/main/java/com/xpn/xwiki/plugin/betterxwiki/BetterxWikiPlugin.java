package com.xpn.xwiki.plugin.betterxwiki;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.xwiki.model.reference.DocumentReference;

import com.xpn.xwiki.XWikiContext;
import com.xpn.xwiki.XWikiException;
import com.xpn.xwiki.api.Api;
import com.xpn.xwiki.doc.XWikiDocument;
import com.xpn.xwiki.objects.BaseObject;
import com.xpn.xwiki.plugin.XWikiDefaultPlugin;
import com.xpn.xwiki.plugin.XWikiPluginInterface;

/**
 * Plugin Better xWiki, selon le tutoriel CreatingPlugins.
 * L’identifiant exposé dans Velocity est {@code $xwiki.betterxwiki}.
 */
public class BetterxWikiPlugin extends XWikiDefaultPlugin {
    static final List<String> FEATURES = List.of(
        "sideToolbar",
        "alertBlocks",
        "macroShortcuts",
        "tablePasteClean",
        "editorFullscreen",
        "editorOutline",
        "tableRows",
        "tableColumns",
        "tableDelete",
        "tableDuplicate",
        "tableMove",
        "tableCellColors",
        "tableBandColors",
        "tableMerge",
        "tableShortcuts",
        "stickyHeaders",
        "copyTableTsv",
        "pageSearch",
        "restoreReadPosition"
    );

    private static final Logger LOGGER = LoggerFactory.getLogger(BetterxWikiPlugin.class);

    public BetterxWikiPlugin(String name, String className, XWikiContext context) {
        super(name, className, context);
        init(context);
    }

    @Override
    public String getName() {
        return "betterxwiki";
    }

    @Override
    public Api getPluginApi(XWikiPluginInterface plugin, XWikiContext context) {
        return new BetterxWikiPluginApi((BetterxWikiPlugin) plugin, context);
    }

    public Map<String, Boolean> getSettings(XWikiContext context) {
        Map<String, Boolean> settings = new LinkedHashMap<>();
        BaseObject object = readUserObject(context);
        for (String feature : FEATURES) {
            int value = object == null ? 1 : object.getIntValue(feature, 1);
            settings.put(feature, value != 0);
        }
        return settings;
    }

    private BaseObject readUserObject(XWikiContext context) {
        DocumentReference userReference = context.getUserReference();
        if (userReference == null) {
            return null;
        }
        try {
            DocumentReference settingsReference = new DocumentReference(
                context.getWikiId(),
                List.of("BetterxWiki", "UserSettings"),
                userReference.getName()
            );
            XWikiDocument settingsDocument = context.getWiki().getDocument(settingsReference, context);
            DocumentReference classReference = new DocumentReference(
                context.getWikiId(),
                "BetterxWiki",
                "UserSettingsClass"
            );
            return settingsDocument.getXObject(classReference);
        } catch (XWikiException exception) {
            LOGGER.warn("Impossible de lire les réglages Better xWiki de l’utilisateur courant.", exception);
            return null;
        }
    }
}
