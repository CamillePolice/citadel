<template>
  <div class="max-w-2xl space-y-8">
    <h1 class="text-2xl font-semibold">Aide</h1>

    <section>
      <h2 class="mb-2 text-lg font-medium">Prix de référence</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Pour les sets d'occasion, BrickLink est utilisé comme source de référence (prix de vente soldés). Pour les sets
        neufs/scellés, Avenue de la Brique est la référence (prix retail France). C'est ce prix qui sert à calculer la
        valeur du portefeuille et le P&L.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Sources de prix</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Quatre sources sont consultées : BrickLink (prix de vente soldés), BrickOwl (prix de vente soldés, converti
        GBP→EUR au taux du jour), Avenue de la Brique (prix retail France), et eBay (ventes récentes). Toutes les
        courbes sont visibles sur la fiche de chaque set.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Mise à jour automatique</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Les prix sont rafraîchis automatiquement chaque nuit à 4h pour tous les sets présents dans le portefeuille. Il
        n'est pas possible de déclencher une mise à jour manuelle depuis l'interface.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Prix dégradé</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Quand aucune source de prix n'est disponible pour un set (référence inconnue, scraping échoué), un badge "Prix
        dégradé" est affiché et la valeur du set est comptée à 0 dans le portefeuille.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Valeur du portefeuille</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        La valeur d'un set est calculée comme : prix de référence × quantité. La valeur totale du portefeuille est la
        somme de tous les sets. Le coût total est la somme des prix d'achat saisis manuellement × quantité.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">P&L et ROI</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Le P&L (profit & loss) est la différence entre la valeur totale et le coût total. Le ROI est le rapport P&L /
        coût total, exprimé en pourcentage. Ces deux métriques sont affichées sur le tableau de bord.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Historique du portefeuille</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        Un snapshot de la valeur totale est enregistré chaque nuit après le rafraîchissement des prix. Le graphique du
        tableau de bord affiche l'évolution de cette valeur dans le temps.
      </p>
    </section>

    <section>
      <h2 class="mb-2 text-lg font-medium">Fiche set</h2>
      <p class="text-sm leading-relaxed text-imperial-muted">
        La page détail de chaque set affiche un graphique avec une courbe par source de prix. Les conditions neuf et
        occasion sont représentées sur des courbes séparées. Une ligne en pointillé indique la moyenne globale toutes
        sources confondues.
      </p>
    </section>
  </div>
</template>
