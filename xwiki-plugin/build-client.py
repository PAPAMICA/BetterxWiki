#!/usr/bin/env python3
"""Prépare les pages XAR de Better xWiki à partir du script Chrome, sans le thème."""

from pathlib import Path
import base64
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
CHROME = ROOT.parent / "chrome" / "src"
OUT = ROOT / "betterxwiki-ui" / "src" / "main" / "resources" / "BetterxWiki"

FEATURES = [
    ("sideToolbar", "edit", "Barre à droite", "En édition classique, fixe la barre d’outils en une colonne à droite."),
    ("alertBlocks", "edit", "Blocs d’alerte", "Insère un bloc info, succès, attention ou erreur."),
    ("macroShortcuts", "edit", "Raccourcis de macros", "Insère un bloc de code, un bloc info ou une table des matières."),
    ("tablePasteClean", "edit", "Collage de tableau nettoyé", "Colle un tableau Excel ou Sheets sans largeurs de colonnes imposées."),
    ("editorFullscreen", "edit", "Plein écran", "Affiche l’éditeur sur tout l’écran. Échap pour quitter."),
    ("editorOutline", "edit", "Sommaire d’édition", "Liste les titres à côté de l’éditeur pour y sauter."),
    ("tableRows", "table", "Ajout rapide de lignes", "Insère une ligne au-dessus ou en dessous de la ligne courante."),
    ("tableColumns", "table", "Ajout rapide de colonnes", "Insère une colonne à gauche ou à droite de la colonne courante."),
    ("tableDelete", "table", "Suppression de ligne ou de colonne", "Supprime la ligne ou la colonne courante."),
    ("tableDuplicate", "table", "Duplication de ligne ou de colonne", "Duplique la ligne ou la colonne courante."),
    ("tableMove", "table", "Déplacement de ligne ou de colonne", "Déplace la ligne ou la colonne courante."),
    ("tableCellColors", "table", "Couleur de fond des cellules", "Applique ou retire un fond coloré sur les cellules sélectionnées."),
    ("tableBandColors", "table", "Couleur de ligne ou de colonne", "Applique la dernière couleur à toute la ligne ou toute la colonne."),
    ("tableMerge", "table", "Fusion et scission", "Fusionne vers la droite ou le bas, ou scinde la cellule."),
    ("tableShortcuts", "table", "Raccourcis d’insertion", "Alt+Maj+flèches insère une ligne ou une colonne."),
    ("stickyHeaders", "read", "En-tête de tableau fixe", "Garde la première ligne de titres visible pendant le défilement."),
    ("copyTableTsv", "read", "Copier le tableau", "Copie un tableau de la page pour le coller dans un tableur."),
    ("pageSearch", "read", "Recherche dans la page", "Ctrl+Maj+F ou Cmd+Maj+F cherche dans la page ouverte."),
    ("restoreReadPosition", "read", "Retour à l’endroit lu", "Après une sauvegarde, retrouve la position de lecture."),
]

GROUPS = [
    ("edit", "Édition"),
    ("table", "Tableaux"),
    ("read", "Lecture"),
]


def patch_script(source: str) -> str:
    source = source.replace(
        """const DEFAULT_SETTINGS = {
  appleTheme: true,
  draculaTheme: false,
  tableRows: true,""",
        """const DEFAULT_SETTINGS = {
  tableRows: true,""",
        1,
    )
    old_apply = """function applyPublishedSettings() {
  const node = document.getElementById(SETTINGS_NODE_ID);
  if (!node?.textContent) return;
  try {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(node.textContent) };
  } catch {
    return;
  }
  settingsReady = true;
  refreshAll();
}"""
    new_apply = """function applyPublishedSettings() {
  let published = window.BETTERXWIKI_SETTINGS;
  if (!published) {
    const node = document.getElementById(SETTINGS_NODE_ID);
    if (!node?.textContent) return;
    try {
      published = JSON.parse(node.textContent);
    } catch {
      return;
    }
  }
  settings = { ...DEFAULT_SETTINGS, ...published };
  settingsReady = true;
  refreshAll();
}"""
    if old_apply not in source:
        raise SystemExit("applyPublishedSettings introuvable")
    source = source.replace(old_apply, new_apply, 1)

    start = source.find("function syncViewFeatures()")
    end = source.find("function syncEditorTheme(")
    if start < 0 or end < 0:
        raise SystemExit("syncViewFeatures introuvable")
    source = source[:start] + """function syncViewFeatures() {
  document.documentElement.classList.toggle("bx-side-toolbar", enabled("sideToolbar"));
  document.documentElement.classList.toggle("bx-sticky", enabled("stickyHeaders"));
  syncStickyOffset();
  searchButton.hidden = !enabled("pageSearch");
  if (!enabled("copyTableTsv")) hideCopyButton();
  updateEditorChrome();
}

""" + source[end:]

    start = source.find("function editorThemeCss()")
    end = source.find("function watchEditorPanels()")
    if start < 0 or end < 0:
        raise SystemExit("editorThemeCss introuvable")
    source = source[:start] + """function editorThemeCss() {
  return "";
}

""" + source[end:]

    start = source.find("function panelThemeCss()")
    end = source.find("const APPLE_EDITOR_CSS")
    if start < 0 or end < 0:
        raise SystemExit("panelThemeCss introuvable")
    source = source[:start] + """function panelThemeCss() {
  return "";
}

""" + source[end:]

    start = source.find("const APPLE_EDITOR_CSS")
    end = source.find("function syncStickyOffset()")
    if start < 0 or end < 0:
        raise SystemExit("feuilles de thème introuvables")
    source = source[:start] + source[end:]
    source = source.replace(
        "// Clés alignées sur src/features/registry.js. Le nœud est aussi écrit par src/bridge.js.\n",
        "// Réglages lus dans window.BETTERXWIKI_SETTINGS, posé par BetterxWiki.Client.\n",
        1,
    )
    return source


def functional_css(source: str) -> str:
    lines = source.splitlines(keepends=True)
    head = "".join(lines[:283])
    rail = "".join(lines[1254:1501])
    rail = rail.replace("html.bx-themed.bx-side-toolbar", "html.bx-side-toolbar")
    apple = """html.bx-apple.bx-side-toolbar .cke_float a.cke_button_on .cke_button_icon {
  filter: brightness(0) invert(1);
}

"""
    rail = rail.replace(apple, "")
    replacements = {
        "var(--xwiki-border-color)": "#d0d5dd",
        "var(--card-bg)": "#fff",
        "var(--search-fill)": "#f4f6f8",
        "var(--text-muted)": "#6b7787",
        "var(--text-color)": "#243044",
        "var(--sidebar-hover)": "#eef2f6",
        "var(--component-active-bg)": "#007aff",
    }
    for old, new in replacements.items():
        rail = rail.replace(old, new)
    panel = """
html.bx-side-toolbar .cke_panel.bx-float-panel {
  z-index: 100010 !important;
  max-height: calc(100vh - 24px) !important;
  overflow: auto !important;
}
"""
    css = head + "\n" + rail + panel
    if "bx-themed" in css or "bx-apple" in css or "bx-dracula" in css:
        raise SystemExit("le CSS du plugin contient encore un thème")
    return css


def page(name, title, hidden, content, extra="", web="BetterxWiki", parent="BetterxWiki.WebHome"):
    return f"""<?xml version="1.1" encoding="UTF-8"?>
<xwikidoc version="1.1">
  <web>{web}</web>
  <name>{name}</name>
  <language/>
  <defaultLanguage>fr</defaultLanguage>
  <translation>0</translation>
  <creator>xwiki:XWiki.superadmin</creator>
  <parent>{parent}</parent>
  <author>xwiki:XWiki.superadmin</author>
  <contentAuthor>xwiki:XWiki.superadmin</contentAuthor>
  <version>1.1</version>
  <title>{title}</title>
  <comment/>
  <minorEdit>false</minorEdit>
  <syntaxId>xwiki/2.1</syntaxId>
  <hidden>{"true" if hidden else "false"}</hidden>
  <content><![CDATA[{content}]]></content>
{extra}
</xwikidoc>
"""


def required_right(document_name, guid):
    return f"""  <object>
    <name>{document_name}</name>
    <number>0</number>
    <className>XWiki.RequiredRightClass</className>
    <guid>{guid}</guid>
    <property>
      <level>programming</level>
    </property>
  </object>
"""


def rights_object(document_name, number, guid, groups, users, levels):
    return f"""  <object>
    <name>{document_name}</name>
    <number>{number}</number>
    <className>XWiki.XWikiRights</className>
    <guid>{guid}</guid>
    <property>
      <allow>1</allow>
    </property>
    <property>
      <groups>{groups}</groups>
    </property>
    <property>
      <levels>{levels}</levels>
    </property>
    <property>
      <users>{users}</users>
    </property>
  </object>
"""


def space_rights(document_name, view_guid, edit_guid):
    return (
        rights_object(document_name, 0, view_guid, "XWiki.XWikiAllGroup", "", "view")
        + rights_object(document_name, 1, edit_guid, "XWiki.XWikiAdminGroup", "", "edit,delete")
    )


def boolean_property(name, label, number):
    return f"""    <{name}>
      <disabled>0</disabled>
      <displayFormType>checkbox</displayFormType>
      <displayType>yesno</displayType>
      <name>{name}</name>
      <number>{number}</number>
      <prettyName>{label}</prettyName>
      <unmodifiable>0</unmodifiable>
      <defaultValue>1</defaultValue>
      <classType>com.xpn.xwiki.objects.classes.BooleanClass</classType>
    </{name}>
"""


def class_page():
    props = "".join(boolean_property(feature[0], feature[2], index) for index, feature in enumerate(FEATURES, start=1))
    return f"""<?xml version="1.1" encoding="UTF-8"?>
<xwikidoc version="1.1">
  <web>BetterxWiki</web>
  <name>UserSettingsClass</name>
  <language/>
  <defaultLanguage>fr</defaultLanguage>
  <translation>0</translation>
  <creator>xwiki:XWiki.superadmin</creator>
  <parent>BetterxWiki.WebHome</parent>
  <author>xwiki:XWiki.superadmin</author>
  <contentAuthor>xwiki:XWiki.superadmin</contentAuthor>
  <version>1.1</version>
  <title>Réglages utilisateur Better xWiki</title>
  <comment/>
  <minorEdit>false</minorEdit>
  <syntaxId>xwiki/2.1</syntaxId>
  <hidden>true</hidden>
  <content/>
  <class>
    <name>BetterxWiki.UserSettingsClass</name>
    <customClass/>
    <customMapping/>
    <defaultViewSheet/>
    <defaultEditSheet/>
    <defaultWeb/>
    <nameField/>
    <validationScript/>
{props}  </class>
</xwikidoc>
"""


def settings_page():
    groups = []
    for group_id, group_label in GROUPS:
        items = [feature for feature in FEATURES if feature[1] == group_id]
        rows = ",\n".join(
            f"    ['{feature[0]}', \"{feature[2]}\", \"{feature[3]}\"]" for feature in items
        )
        groups.append(
            f"""<h2>{group_label}</h2>
#set ($bxFields = [
{rows}
])
#foreach ($bxField in $bxFields)
  #set ($bxOn = true)
  #if ($bxObject && \"$!bxObject.getValue($bxField.get(0))\" == '0')
    #set ($bxOn = false)
  #end
  <label>
    <input type="hidden" name="BetterxWiki.UserSettingsClass_${{bxNumber}}_$bxField.get(0)" value="0" />
    <input type="checkbox" name="BetterxWiki.UserSettingsClass_${{bxNumber}}_$bxField.get(0)" value="1"#if ($bxOn) checked="checked"#end />
    <span><strong>$escapetool.xml($bxField.get(1))</strong><span class="bx-hint">$escapetool.xml($bxField.get(2))</span></span>
  </label>
#end"""
        )
    body = "\n".join(groups)
    content = f"""{{{{velocity}}}}
#if ("$!xcontext.user" == '' || "$!xcontext.user" == 'XWiki.XWikiGuest')
{{{{info}}}}Connectez-vous pour régler Better xWiki. Chaque compte a ses propres options.{{{{/info}}}}
#stop
#end
#set ($bxSettingsRef = $services.model.createDocumentReference($xcontext.database, ['BetterxWiki', 'UserSettings'], $xcontext.userReference.name))
#set ($bxDoc = $xwiki.getDocument($bxSettingsRef))
#set ($bxChanged = false)
#if ($bxDoc.isNew())
  #set ($bxRights = $bxDoc.newObject('XWiki.XWikiRights'))
  #set ($discard = $bxRights.set('users', "$!xcontext.user"))
  #set ($discard = $bxRights.set('levels', 'view,edit'))
  #set ($discard = $bxRights.set('allow', 1))
  $bxDoc.setHidden(true)
  #set ($bxChanged = true)
#end
#if (!$bxDoc.getObject('BetterxWiki.UserSettingsClass'))
  #set ($discard = $bxDoc.newObject('BetterxWiki.UserSettingsClass'))
  #set ($bxChanged = true)
#end
#if ($bxChanged)
  $bxDoc.save('Réglages Better xWiki', true)
  #set ($bxDoc = $xwiki.getDocument($bxSettingsRef))
#end
#set ($bxObject = $bxDoc.getObject('BetterxWiki.UserSettingsClass'))
#set ($bxNumber = 0)
#if ($bxObject)
  #set ($bxNumber = $bxObject.number)
#end
{{{{html clean="false"}}}}
<p>Ces options ne concernent que votre compte. Elles s’appliquent au prochain affichage d’une page.</p>
<form action="$bxDoc.getURL('save')" method="post" class="xform bx-settings">
  <div>
    <input type="hidden" name="form_token" value="$!services.csrf.token" />
    <input type="hidden" name="xredirect" value="$doc.getURL()" />
  </div>
  <style>
    .bx-settings label {{ display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-top: 1px solid #e6e8ee; }}
    .bx-settings label span {{ display: block; }}
    .bx-settings label strong {{ display: block; }}
    .bx-settings .bx-hint {{ display: block; color: #5c6570; font-size: 0.92em; }}
  </style>
{body}
  <p><input type="submit" class="btn btn-primary" value="Enregistrer" /></p>
</form>
{{{{/html}}}}
{{{{/velocity}}}}
"""
    return page("Settings", "Better xWiki", False, content, required_right("BetterxWiki.Settings", "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a10"))


def drawer_page():
    content = """{{velocity}}
#if ("$!xcontext.user" != "" && "$!xcontext.user" != "XWiki.XWikiGuest")
{{html clean="false"}}
#template('drawer_macros.vm')
#drawerItem($xwiki.getURL('BetterxWiki.Settings'), 'wrench', 'Better xWiki', 'tmBetterxWiki')
{{/html}}
#end
{{/velocity}}
"""
    extra = f"""  <object>
    <name>BetterxWiki.Drawer</name>
    <number>0</number>
    <className>XWiki.UIExtensionClass</className>
    <guid>8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a01</guid>
    <class>
      <name>XWiki.UIExtensionClass</name>
      <customClass/>
      <customMapping/>
      <defaultViewSheet/>
      <defaultEditSheet/>
      <defaultWeb/>
      <nameField/>
      <validationScript/>
      <content>
        <disabled>0</disabled>
        <name>content</name>
        <number>3</number>
        <prettyName>Extension Content</prettyName>
        <rows>10</rows>
        <size>40</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.TextAreaClass</classType>
      </content>
      <extensionPointId>
        <disabled>0</disabled>
        <name>extensionPointId</name>
        <number>1</number>
        <prettyName>Extension Point ID</prettyName>
        <size>30</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.StringClass</classType>
      </extensionPointId>
      <name>
        <disabled>0</disabled>
        <name>name</name>
        <number>2</number>
        <prettyName>Extension ID</prettyName>
        <size>30</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.StringClass</classType>
      </name>
      <parameters>
        <disabled>0</disabled>
        <name>parameters</name>
        <number>4</number>
        <prettyName>Extension Parameters</prettyName>
        <rows>10</rows>
        <size>40</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.TextAreaClass</classType>
      </parameters>
      <scope>
        <cache>0</cache>
        <disabled>0</disabled>
        <displayType>select</displayType>
        <multiSelect>0</multiSelect>
        <name>scope</name>
        <number>5</number>
        <prettyName>Extension Scope</prettyName>
        <relationalStorage>0</relationalStorage>
        <separator> </separator>
        <separators>|, </separators>
        <size>1</size>
        <unmodifiable>0</unmodifiable>
        <values>wiki=Current Wiki|user=Current User|global=Global</values>
        <classType>com.xpn.xwiki.objects.classes.StaticListClass</classType>
      </scope>
    </class>
    <property>
      <content>{content}</content>
    </property>
    <property>
      <extensionPointId>org.xwiki.plaftorm.drawer</extensionPointId>
    </property>
    <property>
      <name>org.xwiki.betterxwiki.drawer</name>
    </property>
    <property>
      <parameters>order=51000
category=local</parameters>
    </property>
    <property>
      <scope>wiki</scope>
    </property>
  </object>"""
    # The drawer content is nested in XML text, so escape it instead of raw tags.
    escaped = (
        content.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )
    extra = extra.replace(f"<content>{content}</content>", f"<content>{escaped}</content>")
    return page(
        "Drawer",
        "Better xWiki",
        True,
        "",
        extra + required_right("BetterxWiki.Drawer", "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a12"),
    )


def client_page(script: str, css: str):
    names = [feature[0] for feature in FEATURES]
    rows = "\n".join(
        f'"{name}": #if ($bxObj && "$!bxObj.getValue(\'{name}\')" == \'0\')false#{{else}}true#end,'
        for name in names
    )
    bootstrap = f"""#set ($bx = $xwiki.get('betterxwiki'))
#if ($bx)
window.BETTERXWIKI_SETTINGS = $jsontool.serialize($bx.settings);
#else
#set ($bxObj = false)
#if ($xcontext.userReference)
  #set ($bxSettingsRef = $services.model.createDocumentReference($xcontext.database, ['BetterxWiki', 'UserSettings'], $xcontext.userReference.name))
  #set ($bxSettingsDoc = $xwiki.getDocument($bxSettingsRef))
  #set ($bxObj = $bxSettingsDoc.getObject('BetterxWiki.UserSettingsClass'))
#end
window.BETTERXWIKI_SETTINGS = {{
{rows}
}};
#end
(function () {{
  var node = document.createElement("script");
  node.async = false;
  node.src = "$xwiki.getAttachmentURL('BetterxWiki.Client', 'betterxwiki.js')" + "?v=1.0.0";
  document.documentElement.appendChild(node);
}})();
"""
    encoded = base64.b64encode(script.encode("utf-8")).decode("ascii")
    wrapped = "\n".join(encoded[i:i + 76] for i in range(0, len(encoded), 76))
    extra = f"""  <attachment>
    <filename>betterxwiki.js</filename>
    <filesize>{len(script.encode("utf-8"))}</filesize>
    <author>xwiki:XWiki.superadmin</author>
    <version>1.1</version>
    <comment/>
    <content>{wrapped}</content>
  </attachment>
  <object>
    <name>BetterxWiki.Client</name>
    <number>0</number>
    <className>XWiki.JavaScriptExtension</className>
    <guid>8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a02</guid>
    <class>
      <name>XWiki.JavaScriptExtension</name>
      <customClass/>
      <customMapping/>
      <defaultViewSheet/>
      <defaultEditSheet/>
      <defaultWeb/>
      <nameField/>
      <validationScript/>
      <name>
        <disabled>0</disabled>
        <name>name</name>
        <number>1</number>
        <prettyName>Name</prettyName>
        <size>30</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.StringClass</classType>
      </name>
      <code>
        <disabled>0</disabled>
        <contenttype>PureText</contenttype>
        <name>code</name>
        <number>2</number>
        <prettyName>Code</prettyName>
        <rows>20</rows>
        <size>40</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.TextAreaClass</classType>
      </code>
      <use>
        <cache>0</cache>
        <disabled>0</disabled>
        <displayType>select</displayType>
        <multiSelect>0</multiSelect>
        <name>use</name>
        <number>3</number>
        <prettyName>Use this extension</prettyName>
        <relationalStorage>0</relationalStorage>
        <separator> </separator>
        <separators>|, </separators>
        <size>1</size>
        <unmodifiable>0</unmodifiable>
        <values>currentPage|onDemand|always</values>
        <classType>com.xpn.xwiki.objects.classes.StaticListClass</classType>
      </use>
      <parse>
        <disabled>0</disabled>
        <displayFormType>select</displayFormType>
        <displayType>yesno</displayType>
        <name>parse</name>
        <number>4</number>
        <prettyName>Parse content</prettyName>
        <unmodifiable>0</unmodifiable>
        <defaultValue>0</defaultValue>
        <classType>com.xpn.xwiki.objects.classes.BooleanClass</classType>
      </parse>
      <cache>
        <cache>0</cache>
        <disabled>0</disabled>
        <displayType>select</displayType>
        <multiSelect>0</multiSelect>
        <name>cache</name>
        <number>5</number>
        <prettyName>Caching policy</prettyName>
        <relationalStorage>0</relationalStorage>
        <separator> </separator>
        <separators>|, </separators>
        <size>1</size>
        <unmodifiable>0</unmodifiable>
        <values>long|short|default|forbid</values>
        <classType>com.xpn.xwiki.objects.classes.StaticListClass</classType>
      </cache>
    </class>
    <property>
      <name>Better xWiki</name>
    </property>
    <property>
      <code><![CDATA[{bootstrap}]]></code>
    </property>
    <property>
      <use>always</use>
    </property>
    <property>
      <parse>1</parse>
    </property>
    <property>
      <cache>forbid</cache>
    </property>
  </object>
  <object>
    <name>BetterxWiki.Client</name>
    <number>0</number>
    <className>XWiki.StyleSheetExtension</className>
    <guid>8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a03</guid>
    <class>
      <name>XWiki.StyleSheetExtension</name>
      <customClass/>
      <customMapping/>
      <defaultViewSheet/>
      <defaultEditSheet/>
      <defaultWeb/>
      <nameField/>
      <validationScript/>
      <name>
        <disabled>0</disabled>
        <name>name</name>
        <number>1</number>
        <prettyName>Name</prettyName>
        <size>30</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.StringClass</classType>
      </name>
      <code>
        <disabled>0</disabled>
        <contenttype>PureText</contenttype>
        <name>code</name>
        <number>2</number>
        <prettyName>Code</prettyName>
        <rows>20</rows>
        <size>40</size>
        <unmodifiable>0</unmodifiable>
        <classType>com.xpn.xwiki.objects.classes.TextAreaClass</classType>
      </code>
      <use>
        <cache>0</cache>
        <disabled>0</disabled>
        <displayType>select</displayType>
        <multiSelect>0</multiSelect>
        <name>use</name>
        <number>3</number>
        <prettyName>Use this extension</prettyName>
        <relationalStorage>0</relationalStorage>
        <separator> </separator>
        <separators>|, </separators>
        <size>1</size>
        <unmodifiable>0</unmodifiable>
        <values>currentPage|onDemand|always</values>
        <classType>com.xpn.xwiki.objects.classes.StaticListClass</classType>
      </use>
      <parse>
        <disabled>0</disabled>
        <displayFormType>select</displayFormType>
        <displayType>yesno</displayType>
        <name>parse</name>
        <number>4</number>
        <prettyName>Parse content</prettyName>
        <unmodifiable>0</unmodifiable>
        <defaultValue>0</defaultValue>
        <classType>com.xpn.xwiki.objects.classes.BooleanClass</classType>
      </parse>
      <cache>
        <cache>0</cache>
        <disabled>0</disabled>
        <displayType>select</displayType>
        <multiSelect>0</multiSelect>
        <name>cache</name>
        <number>5</number>
        <prettyName>Caching policy</prettyName>
        <relationalStorage>0</relationalStorage>
        <separator> </separator>
        <separators>|, </separators>
        <size>1</size>
        <unmodifiable>0</unmodifiable>
        <values>long|short|default|forbid</values>
        <classType>com.xpn.xwiki.objects.classes.StaticListClass</classType>
      </cache>
    </class>
    <property>
      <name>Better xWiki</name>
    </property>
    <property>
      <code><![CDATA[{css}]]></code>
    </property>
    <property>
      <use>always</use>
    </property>
    <property>
      <parse>0</parse>
    </property>
    <property>
      <cache>long</cache>
    </property>
  </object>"""
    return page(
        "Client",
        "Better xWiki",
        True,
        "",
        extra + required_right("BetterxWiki.Client", "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a11"),
    )


def webhome():
    content = """Better xWiki ajoute des outils d’édition et de lecture, sans changer l’habillage du wiki.

Chaque utilisateur ouvre **Better xWiki** dans le menu de droite, sous **User Index**, et active ou désactive les options pour son propre compte.

{{toc/}}

== Édition ==

* barre d’outils en colonne à droite, en édition classique
* blocs d’alerte
* raccourcis de macros
* collage d’un tableau Excel ou Sheets sans largeurs imposées
* plein écran
* sommaire des titres

En mode WYSIWYG, la barre CKEditor reste celle du wiki.

== Tableaux ==

* insérer, supprimer, dupliquer ou déplacer une ligne ou une colonne
* colorer les cellules, ou toute la ligne et toute la colonne
* fusionner ou scinder
* Alt+Maj+flèches pour insérer

== Lecture ==

* en-tête de tableau fixe
* bouton Copier au survol d’un tableau
* recherche dans la page avec Ctrl+Maj+F ou Cmd+Maj+F
* retour à l’endroit lu après une sauvegarde
"""
    return page(
        "WebHome",
        "Better xWiki",
        False,
        content,
        space_rights("BetterxWiki.WebHome", "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a20", "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a21"),
    )


def user_settings_home():
    content = "Chaque utilisateur a ici sa propre page de réglages. Le menu de droite y mène."
    return page(
        "WebHome",
        "Réglages des utilisateurs",
        True,
        content,
        space_rights(
            "BetterxWiki.UserSettings.WebHome",
            "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a22",
            "8f3c2a10-6b4e-4d77-9a21-b7e4c0d11a23",
        ),
        web="BetterxWiki.UserSettings",
        parent="BetterxWiki.WebHome",
    )


def main():
    script = patch_script((CHROME / "content.js").read_text(encoding="utf-8"))
    css = functional_css((CHROME / "content.css").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    client_dir = ROOT / "betterxwiki-ui" / "src" / "client"
    client_dir.mkdir(parents=True, exist_ok=True)
    (client_dir / "betterxwiki.js").write_text(script, encoding="utf-8")
    (OUT / "WebHome.xml").write_text(webhome(), encoding="utf-8")
    (OUT / "UserSettingsWebHome.xml").write_text(user_settings_home(), encoding="utf-8")
    (OUT / "UserSettingsClass.xml").write_text(class_page(), encoding="utf-8")
    (OUT / "Settings.xml").write_text(settings_page(), encoding="utf-8")
    (OUT / "Drawer.xml").write_text(drawer_page(), encoding="utf-8")
    (OUT / "Client.xml").write_text(client_page(script, css), encoding="utf-8")
    xar_path = write_xar()
    print(f"script {len(script)} css {len(css)} -> {OUT}")
    print(f"xar {xar_path}")


def write_xar():
    documents = []
    for path in sorted(OUT.glob("*.xml")):
        root = ET.parse(path).getroot()
        web = root.findtext("web")
        name = root.findtext("name")
        documents.append((path, web, name))
    files = "\n".join(
        f'    <file defaultAction="0" language="">{web}.{name}</file>' for _path, web, name in documents
    )
    package = f"""<?xml version="1.0" encoding="UTF-8"?>
<package>
  <infos>
    <name>Better xWiki</name>
    <description>Outils d’édition et de lecture pour XWiki.</description>
    <licence/>
    <author>XWiki.Admin</author>
    <version>1.0.0</version>
    <backupPack>false</backupPack>
  </infos>
  <files>
{files}
  </files>
</package>
"""
    xar_path = ROOT / "betterxwiki-ui" / "target" / "betterxwiki-ui-1.0.0.xar"
    xar_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(xar_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("package.xml", package)
        for path, web, name in documents:
            archive.write(path, f"{web.replace('.', '/')}/{name}.xml")
    return xar_path


if __name__ == "__main__":
    main()
