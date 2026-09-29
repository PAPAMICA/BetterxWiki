export const STORAGE_KEY = "features";

export const GROUPS = [
  { id: "look", label: "Apparence" },
  { id: "table", label: "Tableaux" },
  { id: "edit", label: "Édition" },
  { id: "read", label: "Lecture" },
];

export const FEATURES = [
  {
    id: "appleTheme",
    group: "look",
    label: "Thème épuré",
    description: "Allège l’interface : fond clair, typographie système, boutons et panneaux plus calmes.",
    default: true,
  },
  {
    id: "tableRows",
    group: "table",
    label: "Ajout rapide de lignes",
    description: "Insère une ligne au-dessus ou en dessous de la ligne courante.",
    default: true,
  },
  {
    id: "tableColumns",
    group: "table",
    label: "Ajout rapide de colonnes",
    description: "Insère une colonne à gauche ou à droite de la colonne courante.",
    default: true,
  },
  {
    id: "tableDelete",
    group: "table",
    label: "Suppression de ligne ou de colonne",
    description: "Supprime la ligne ou la colonne courante.",
    default: true,
  },
  {
    id: "tableDuplicate",
    group: "table",
    label: "Duplication de ligne ou de colonne",
    description: "Duplique la ligne ou la colonne courante.",
    default: true,
  },
  {
    id: "tableMove",
    group: "table",
    label: "Déplacement de ligne ou de colonne",
    description: "Déplace la ligne ou la colonne courante.",
    default: true,
  },
  {
    id: "tableCellColors",
    group: "table",
    label: "Couleur de fond des cellules",
    description: "Applique ou retire un fond coloré sur les cellules sélectionnées.",
    default: true,
  },
  {
    id: "tableBandColors",
    group: "table",
    label: "Couleur de ligne ou de colonne",
    description: "Applique la dernière couleur à toute la ligne ou toute la colonne.",
    default: true,
  },
  {
    id: "tableMerge",
    group: "table",
    label: "Fusion et scission",
    description: "Fusionne vers la droite ou le bas, ou scinde la cellule.",
    default: true,
  },
  {
    id: "tableShortcuts",
    group: "table",
    label: "Raccourcis d’insertion",
    description: "Alt+Maj+flèches insère une ligne ou une colonne.",
    default: true,
  },
  {
    id: "alertBlocks",
    group: "edit",
    label: "Blocs d’alerte",
    description: "Insère un bloc info, succès, attention ou erreur.",
    default: true,
  },
  {
    id: "macroShortcuts",
    group: "edit",
    label: "Raccourcis de macros",
    description: "Insère un bloc de code, un bloc info ou une table des matières.",
    default: true,
  },
  {
    id: "tablePasteClean",
    group: "edit",
    label: "Collage de tableau nettoyé",
    description: "Colle un tableau Excel ou Sheets sans largeurs de colonnes imposées.",
    default: true,
  },
  {
    id: "editorFullscreen",
    group: "edit",
    label: "Plein écran",
    description: "Affiche l’éditeur sur tout l’écran. Échap pour quitter.",
    default: true,
  },
  {
    id: "editorOutline",
    group: "edit",
    label: "Sommaire d’édition",
    description: "Liste les titres à côté de l’éditeur pour y sauter.",
    default: true,
  },
  {
    id: "stickyHeaders",
    group: "read",
    label: "En-tête de tableau fixe",
    description: "Garde la première ligne de titres visible pendant le défilement.",
    default: true,
  },
  {
    id: "copyTableTsv",
    group: "read",
    label: "Copier le tableau",
    description: "Copie un tableau de la page pour le coller dans un tableur.",
    default: true,
  },
  {
    id: "pageSearch",
    group: "read",
    label: "Recherche dans la page",
    description: "Ctrl+Maj+F ou Cmd+Maj+F cherche dans la page ouverte.",
    default: true,
  },
  {
    id: "restoreReadPosition",
    group: "read",
    label: "Retour à l’endroit lu",
    description: "Après une sauvegarde, retrouve la position de lecture.",
    default: true,
  },
];

export function defaultSettings() {
  return Object.fromEntries(FEATURES.map((feature) => [feature.id, feature.default]));
}

export function normalizeSettings(stored) {
  return { ...defaultSettings(), ...(stored || {}) };
}
