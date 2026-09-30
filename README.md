# Better xWiki

Deux livraisons séparées :

- `chrome/` : l’extension Chrome, avec les thèmes épuré et Dracula
- `xwiki-plugin/` : le plugin XWiki, avec les mêmes outils d’édition et de lecture, sans habillage

## Extension Chrome

1. Ouvrir `chrome://extensions`.
2. Activer le mode développeur.
3. Choisir « Charger l’extension non empaquetée » et sélectionner le dossier `chrome`.
4. Recharger l’extension si elle était déjà installée.

Chrome 111 ou plus récent est requis. Chaque option s’active depuis l’icône de l’extension, y compris sur un onglet déjà ouvert. L’extension ne fait rien sur les sites qui ne sont pas xWiki.

## Plugin XWiki

Le plugin suit le tutoriel [CreatingPlugins](https://www.xwiki.org/xwiki/bin/view/Documentation/DevGuide/Tutorials/CreatingPlugins/). La classe `com.xpn.xwiki.plugin.betterxwiki.BetterxWikiPlugin` étend `XWikiDefaultPlugin`. Dans Velocity, elle est disponible sous `$xwiki.betterxwiki`.

Les réglages de chaque utilisateur sont une entrée du menu de droite, juste sous User Index. Cette entrée est une extension d’interface sur le point `org.xwiki.plaftorm.drawer`, avec `order=51000`.

### Compiler

Depuis `xwiki-plugin`, avec Java 17, Maven et Python 3. Les bibliothèques viennent des dépôts XWiki (`https://maven.xwiki.org`) et CSS4J (`https://css4j.github.io/maven/`).

```
mvn package
```

Deux fichiers sont produits :

- `betterxwiki-ui/target/betterxwiki-ui-1.0.0.xar`
- `betterxwiki-plugin/target/betterxwiki-plugin-1.0.0.jar`

### Installer les pages

1. Se connecter avec un compte administrateur.
2. Ouvrir Administration, puis Contenu, puis Importer.
3. Importer `betterxwiki-ui-1.0.0.xar`.
4. Ouvrir le menu de droite : Better xWiki est sous User Index.

La page de réglages est enregistrée par XWiki.Admin. Ce compte doit garder les droits de programmation, car le premier affichage crée l’objet de réglages sur le profil de l’utilisateur.

Les changements s’appliquent au prochain affichage d’une page.

### Enregistrer le plugin Java

1. Copier `betterxwiki-plugin-1.0.0.jar` dans `WEB-INF/lib`.
2. Dans `WEB-INF/xwiki.cfg`, ajouter la classe à `xwiki.plugins` :

```
xwiki.plugins=com.xpn.xwiki.plugin.betterxwiki.BetterxWikiPlugin
```

Si la ligne existe déjà, ajouter la classe à la fin, séparée par une virgule.

3. Redémarrer XWiki.

`$xwiki.betterxwiki.settings` renvoie alors les réglages de l’utilisateur courant. Les pages importées lisent le même objet sur le profil.
