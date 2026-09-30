package com.xpn.xwiki.plugin.betterxwiki;

import java.util.Map;

import com.xpn.xwiki.XWikiContext;
import com.xpn.xwiki.api.Api;

/**
 * API Velocity {@code $xwiki.betterxwiki}.
 */
public class BetterxWikiPluginApi extends Api {
    private final BetterxWikiPlugin plugin;

    public BetterxWikiPluginApi(BetterxWikiPlugin plugin, XWikiContext context) {
        super(context);
        this.plugin = plugin;
    }

    public Map<String, Boolean> getSettings() {
        return this.plugin.getSettings(this.context);
    }

    public boolean isEnabled(String feature) {
        if (!BetterxWikiPlugin.FEATURES.contains(feature)) {
            return false;
        }
        return Boolean.TRUE.equals(getSettings().get(feature));
    }
}
