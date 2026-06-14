# Design : Page d'aide `/aide`

## Objectif

Page statique expliquant le fonctionnement de Citadel et le calcul des prix. Une section par feature, accessible depuis le header.

## Architecture

- **Route :** `/aide` → `app/pages/aide.vue`
- **Navigation :** lien "Aide" ajouté dans `app/app.vue` (header, à gauche du nom utilisateur)
- **Pas de composant dédié** : contenu inline dans la page, pur HTML/Tailwind
- **Pas de JS** : page entièrement statique, aucun fetch

## Sections

Chaque section = `<h2>` + `<p>`. Ordre logique : compréhension du site → données → calculs → détails.

| #   | Titre                      | Contenu                                                                                                                                                                                                                                          |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Prix de référence          | BrickLink est la référence pour les sets d'occasion. Avenue de la Brique est la référence pour les sets neufs/scellés. C'est ce prix qui sert à calculer la valeur du portefeuille.                                                              |
| 2   | Sources de prix            | Quatre sources sont consultées : BrickLink (prix de vente soldés), BrickOwl (prix de vente soldés, converti GBP→EUR), Avenue de la Brique (prix retail FR), eBay (ventes récentes). Toutes les courbes sont visibles sur la fiche de chaque set. |
| 3   | Mise à jour automatique    | Les prix sont rafraîchis automatiquement chaque nuit à 4h pour tous les sets présents dans le portefeuille.                                                                                                                                      |
| 4   | Prix dégradé               | Quand aucune source de prix n'est disponible pour un set, un badge "Prix dégradé" est affiché et la valeur du set est comptée à 0.                                                                                                               |
| 5   | Valeur du portefeuille     | La valeur d'un set = prix de référence × quantité. La valeur totale est la somme de tous les sets. Le coût total est la somme des prix d'achat × quantité.                                                                                       |
| 6   | P&L et ROI                 | P&L = valeur totale − coût total. ROI = P&L / coût total × 100. Ces métriques sont affichées sur le tableau de bord.                                                                                                                             |
| 7   | Historique du portefeuille | Un snapshot de la valeur totale est enregistré chaque nuit. Le graphique du tableau de bord affiche l'évolution sur la durée.                                                                                                                    |
| 8   | Fiche set                  | La page détail de chaque set affiche un graphique avec une courbe par source de prix, séparant les conditions neuf et occasion.                                                                                                                  |

## Style

Suit le design system existant (`imperial-*` tokens). Structure :

```
<div class="space-y-8 max-w-2xl">
  <h1>Aide</h1>
  <section v-for each>
    <h2 class="text-lg font-medium mb-2">...</h2>
    <p class="text-imperial-muted text-sm leading-relaxed">...</p>
  </section>
</div>
```

## Fichiers modifiés

| Fichier              | Action                             |
| -------------------- | ---------------------------------- |
| `app/pages/aide.vue` | Créer                              |
| `app/app.vue`        | Ajouter lien "Aide" dans le header |
