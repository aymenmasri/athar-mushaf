# Règles permanentes du projet أثر

Ces règles s'appliquent à tout le dépôt. En cas de conflit, l'intégrité du texte coranique, la sécurité des données et la confidentialité priment.

## Texte coranique : donnée immuable

- Ne jamais écrire, compléter, traduire, reformuler, « corriger » ou remplacer une ayah avec une IA, une saisie manuelle ou un texte de démonstration.
- N'intégrer que les fichiers Tanzil explicitement approuvés et documentés dans `assets/quran/SOURCE.md` et `assets/quran/source-receipt.json`.
- Préserver exactement les caractères Unicode du champ d'affichage. Ni formatteur, ni normalisation, ni recherche/remplacement ne doit toucher `uthmaniText`.
- Les fichiers de `assets/quran/source/` sont des entrées archivées : ne pas les éditer. Les JSON générés se recréent uniquement avec `npm run import:quran`.
- Conserver l'index de recherche séparé du texte affiché. Une normalisation est permise uniquement sur la copie destinée à la recherche.
- N'ajouter une métadonnée (page, juz, hizb, type de révélation, etc.) que si sa source et sa licence sont vérifiées. Ne jamais la déduire arbitrairement.
- Documenter la représentation de la basmala, l'URL et la date d'import, la version du corpus, la licence/notice et les SHA-256 des fichiers originaux.
- Après toute opération sur le corpus, exécuter l'import puis la validation d'intégrité. Une différence de checksum, de structure, de numérotation ou de comptage bloque la livraison.
- Séparer strictement le corpus coranique des dédicaces et de toute autre donnée utilisateur.

## Contenu religieux et éditorial

- Ne pas présenter l'application comme garantissant une récompense religieuse.
- Ne pas ajouter de tafsir, traduction, hadith, récitation ou autre contenu religieux sans source autorisée, licence et validation éditoriale explicites.
- Ne jamais utiliser de contenu religieux fictif pour faire passer un test ou remplir une interface.

## Sécurité Supabase et confidentialité

- Le client ne peut lire que `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Ne jamais ajouter une clé `service_role`, une secret key Supabase, un JWT, un mot de passe ou un jeton d'administration au code client, au dépôt, aux logs, aux captures ou aux fixtures.
- Toute variable préfixée `EXPO_PUBLIC_` est intégrée au bundle et doit être considérée comme publique. La sécurité repose sur les contraintes SQL et la RLS, jamais sur la dissimulation de la publishable key.
- Activer et tester la RLS sur chaque table utilisateur. Le créateur ne peut agir que sur ses lignes ; progression et favoris restent privés.
- Une dédicace est non répertoriée : accès public uniquement par le RPC prévu et par un slug imprévisible. Ne jamais fournir un `SELECT` public permettant de lister les dédicaces.
- Valider côté client avec Zod et côté base avec des contraintes. Nettoyer les contenus utilisateur sans altérer les caractères arabes légitimes.
- Ne jamais journaliser le message d'une dédicace, un nom, un token de session ou une position de lecture.
- Ne collecter ni téléphone, ni adresse, ni date de naissance, ni localisation, ni contacts. Aucun suivi publicitaire ou profilage invasif.
- Ne jamais publier automatiquement la dédicace locale de démonstration dans une base de production.

## Périmètre du MVP

- Aucun paiement, abonnement, don financier, publicité, marketplace, messagerie, annuaire public, commentaire public ou réseau social.
- Aucune génération de texte religieux par IA, aucune récitation non vérifiée et aucune gamification excessive.
- Tout élargissement de ce périmètre exige une décision produit explicite et une mise à jour des règles de confidentialité.

## Compatibilité et expérience

- Maintenir une seule base compatible Expo Web, Android et iOS, avec Expo Go tant qu'aucun module natif personnalisé n'est requis.
- Vérifier la compatibilité Expo SDK 54 avant d'ajouter une dépendance ; préférer `npx expo install` pour les paquets liés à Expo/React Native.
- Ne pas employer d'API Web sans garde ni alternative native, et inversement.
- L'arabe et le RTL sont le comportement principal. Préserver la navigation clavier Web, le focus visible, les labels d'accessibilité, le zoom et des zones tactiles d'au moins 44 × 44.
- Les routes Web dynamiques doivent rester ouvrables directement et après rechargement ; toute cible SPA doit réécrire les routes vers `index.html`.
- Conserver le mode démonstration fonctionnel lorsque les deux variables Supabase sont absentes ou invalides.

## Qualité et méthode de travail

- Préserver les modifications existantes et ne pas effectuer de réécriture destructive sans autorisation.
- Une fonctionnalité n'est terminée qu'avec ses états de chargement, vide et erreur, sa validation, son accessibilité et ses tests pertinents.
- Avant livraison, exécuter au minimum : `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` et `npx expo export --platform web`.
- Après une modification ciblée, lancer d'abord les tests ciblés puis la suite appropriée. Ne jamais annoncer un test comme réussi s'il n'a pas été exécuté.
- Tester les parcours critiques sur Web et, lorsque le changement les concerne, sur Expo Go Android/iOS : RTL, navigation, stockage, partage, QR code et liens profonds.
- Ne pas contourner un test d'intégrité, une policy RLS ou une validation pour obtenir un build vert. Corriger la cause ou documenter honnêtement le blocage.
- Ne committer ni `dist/`, ni `.env`, ni artefact local, ni donnée source dont la provenance/licence n'est pas approuvée.
