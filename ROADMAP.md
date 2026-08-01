# Feuille de route — أثر

Cette feuille de route décrit une direction, sans date de livraison ni promesse religieuse. Toute évolution reste soumise aux règles de `AGENTS.md`, notamment la provenance du contenu, la confidentialité, l'accessibilité et la compatibilité Web/Android/iOS.

## Porte de sortie du MVP

- [x] Valider les trois fichiers Tanzil originaux, leur notice et leurs SHA-256.
- [x] Faire réussir l'import déterministe et tous les contrôles des 114 sourates.
- [x] Valider les parcours dédicace, lecture, recherche, favoris et reprise sur le bundle Web de production.
- [ ] Rejouer les parcours et les contrôles RTL sur Expo Go Android et iOS physiques.
- [ ] Auditer les policies RLS avec deux utilisateurs et une session publique.
- [x] Vérifier par tests le cycle local désactivation/suppression et le contrat statique du RPC public.
- [ ] Rejouer désactivation et suppression sur un vrai projet Supabase configuré.
- [x] Faire réussir TypeScript, ESLint, Jest, Playwright et les exports Web, Android et iOS.
- [ ] Tester les routes dynamiques après rechargement sur l'hébergement retenu.
- [ ] Relire en arabe les contenus éditoriaux, les erreurs, le RTL et l'accessibilité.
- [x] Publier une politique de confidentialité minimale conforme aux données réellement traitées.

## Après stabilisation

### Comptes et continuité

- conversion volontaire d'une session anonyme en compte permanent ;
- e-mail/magic link, puis Google et Apple selon les besoins réels ;
- récupération sécurisée de l'accès de gestion ;
- synchronisation multi-appareils des favoris, préférences et progression ;
- stratégie explicite de fusion entre données anonymes, locales et compte existant.

### Lecture

- ختمة individuelle avec objectifs sobres et sans mécanisme culpabilisant ;
- ختمة collective avec consentement, rôles et confidentialité documentés ;
- cache Web hors ligne après étude du poids, des mises à jour et de l'intégrité ;
- outils d'accessibilité supplémentaires et tests avec lecteurs d'écran arabes.

### Contenus vérifiés

- récitations audio uniquement après validation de l'édition, de la récitation, de la licence et de l'hébergement ;
- traductions publiées et autorisées, conservées séparément de l'Uthmani ;
- tafsir provenant d'une source autorisée, avec attribution et revue éditoriale ;
- aucune traduction, explication ou correction automatique générée par IA.

### Distribution

- builds internes EAS et campagne de tests sur appareils d'entrée de gamme ;
- fiche et publication Google Play Store ;
- TestFlight puis App Store ;
- domaine personnalisé, liens universels/app links et stratégie de migration des anciennes URL ;
- CI pour les aperçus Web, l'audit de dépendances et les contrôles d'intégrité.

### Notifications

- étude d'un rappel de lecture strictement optionnel, local par défaut et désactivé au départ ;
- consentement explicite, fréquence réglable et aucune mécanique de rétention invasive ;
- aucune notification contenant un nom ou un message privé sur écran verrouillé sans choix explicite.

## Non planifié sans nouvelle décision produit

Paiement, abonnement, publicité, dons financiers, marketplace, annuaire public, réseau social, commentaires, messagerie, collecte de contacts, profilage publicitaire, horaires de prière, Qibla et gamification excessive restent hors périmètre. Leur ajout ne peut pas être déduit de cette feuille de route.
