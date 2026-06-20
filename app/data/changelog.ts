export interface ChangelogEntry {
  version: string
  date: string
  changes: {
    type: 'feature' | 'fix' | 'improvement'
    description: string
  }[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-06-20',
    changes: [
      {
        type: 'feature',
        description:
          'Espaces de stockage : créez des étagères, tiroirs et boîtes avec une grille visuelle pour placer vos sets',
      },
      {
        type: 'feature',
        description: "Fiche set : badge d'emplacement avec lien vers la grille et position exacte (rangée/colonne)",
      },
      {
        type: 'feature',
        description:
          "Sources de prix : panel affichant l'origine des prix utilisés pour chaque set (BrickLink, Avenue de la Brique…) avec liens vers les annonces",
      },
      { type: 'fix', description: "Le nom d'utilisateur s'affiche correctement en haut à droite" },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-06-18',
    changes: [
      {
        type: 'feature',
        description:
          'Décote automatique sur les sets occasion : moins-value calculée selon complétude, présence boîte et instructions',
      },
      {
        type: 'feature',
        description:
          'Badge statut de commercialisation (Disponible / Fin de commercialisation / Retiré) sur les fiches set',
      },
      { type: 'feature', description: "Recherche autocomplete dans la modale d'ajout de set" },
      {
        type: 'feature',
        description: 'Champs Boîte, Instructions et Minifigs sur chaque item (avec impact sur la valeur)',
      },
      { type: 'feature', description: 'Panel admin : historique des exécutions du worker de prix' },
      { type: 'feature', description: 'Application installable (PWA) sur mobile et desktop' },
      { type: 'feature', description: 'Transactions individuelles BrickLink/eBay visibles sur chaque fiche set' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-11',
    changes: [
      { type: 'feature', description: 'Tableau de bord : valeur totale, P&L, ROI, répartition par thème et état' },
      {
        type: 'feature',
        description:
          'Bibliothèque de sets avec prix de marché en temps réel (BrickLink, BrickOwl, Avenue de la Brique, eBay)',
      },
      { type: 'feature', description: 'Historique de prix par set avec graphique multi-sources' },
      { type: 'feature', description: 'Actualisation automatique des prix chaque nuit à 4h' },
      { type: 'feature', description: 'Export Excel de la collection (4 feuilles : résumé, détail, prix, P&L)' },
      { type: 'feature', description: 'Authentification SSO via Authentik (sans mot de passe)' },
    ],
  },
]
