# أثر — مصحفٌ يبقى لمن تحب

أثر est une application universelle Expo, arabe et RTL, permettant de créer une dédicace non répertoriée puis de lire le Coran, reprendre sa lecture et conserver ses favoris. La même base TypeScript cible le Web, Android et iOS.

Le MVP fonctionne en mode démonstration sans backend. Quand Supabase est configuré, une session anonyme attribue la dédicace à son créateur, synchronise ses favoris et sa progression, et les règles RLS isolent toutes ces données.

> Le texte coranique est une donnée critique et immuable. Il n'est jamais généré, complété ou corrigé par IA. La procédure de provenance et de validation ci-dessous est une condition de publication, pas une promesse implicite de certification religieuse.

## Stack et architecture

- Expo SDK 54, React Native 0.81, React 19, Expo Router 6 et React Native Web ;
- TypeScript strict, ESLint et Prettier ;
- données coraniques locales, importées et contrôlées hors de l'interface ;
- AsyncStorage pour la progression, les favoris et les préférences locales ;
- Supabase Auth anonyme, Postgres et RLS pour le mode connecté ;
- Jest/React Native Testing Library et Playwright pour les parcours Web.

```text
app/                         routes Expo Router et écrans
components/                  composants communs, dédicace, lecture et mise en page
constants/                   thème et constantes partagées
hooks/                       logique React réutilisable
lib/
  quran/                     accès au corpus et recherche
  sharing/                   partage natif/Web, WhatsApp et copie
  storage/                   persistance locale
  supabase/                  client public et dépôts de données
  validation/                schémas Zod et nettoyage
providers/                   contextes applicatifs
assets/quran/
  source/                    fichiers Tanzil originaux, jamais édités
  surahs/                    114 JSON générés, chargés par sourate
  search-index.json          copie normalisée réservée à la recherche
scripts/                     import et validation du corpus
supabase/migrations/         schéma, contraintes, fonctions et policies RLS
tests/                       tests unitaires, composants, intégration et E2E
```

Le flux coranique reste indépendant des contenus utilisateur :

```text
fichiers Tanzil approuvés -> contrôle SHA-256 -> import déterministe
                           -> JSON Uthmani immuable pour l'affichage
                           -> index dérivé et séparé pour la recherche

dédicaces/progression/favoris -> stockage local ou Supabase + RLS
```

Sur le Web, le générateur produit 114 imports `import()` littéraux : l'accueil ne télécharge aucun texte d'ayah, puis le lecteur ne charge que les chunks des sourates demandées. L'index de recherche séparé est lui aussi chargé à la première recherche textuelle. Sur Android et iOS, Metro conserve ces modules dans le bundle natif afin que le corpus reste consultable localement. Un scénario Playwright protège ce contrat de découpage.

## Prérequis

- Node.js 20 LTS et npm 10 ou plus récent ;
- un navigateur moderne ;
- Expo Go à jour pour tester un téléphone physique ;
- Docker uniquement pour lancer Supabase localement ;
- un compte Expo uniquement pour EAS Build/Hosting.

## Installation et lancement

```bash
npm ci
cp .env.example .env.local
npm run start
```

Laisser les deux variables Supabase vides pour le mode démonstration. Expo doit être redémarré après toute modification de `.env.local`.

Raccourcis utiles :

```bash
npm run web                    # serveur Web de développement
npx expo start --web           # équivalent explicite
npx expo start                 # QR Expo Go + raccourcis émulateurs
npx expo start --tunnel        # si le téléphone ne joint pas le réseau local
```

### Android et iOS avec Expo Go

1. Installer Expo Go sur le téléphone.
2. Placer ordinateur et téléphone sur le même réseau, puis lancer `npx expo start`.
3. Scanner le QR code : depuis Expo Go sur Android, ou depuis l'appareil photo sur iOS.
4. Si le LAN est filtré, relancer avec `npx expo start --tunnel`.

Les touches `a` et `i` ouvrent respectivement un émulateur Android configuré et le simulateur iOS ; ce dernier requiert macOS/Xcode. Vérifier sur appareil réel le RTL, le clavier arabe, AsyncStorage, le partage natif, WhatsApp, la copie, le QR code, le changement de taille et le défilement du lecteur.

## Variables d'environnement et modes

Ces valeurs publiques clientes sont acceptées :

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
EXPO_PUBLIC_APP_URL=https://your-public-web-origin.example
```

- **Mode démonstration** : activé si une valeur manque ou est invalide. Lecture, recherche, aperçu, progression et favoris restent locaux ; aucune vraie URL publique n'est créée.
- **Mode connecté** : activé quand les deux valeurs sont valides. La dédicace peut être créée dans Supabase et ouverte via son slug public.

`EXPO_PUBLIC_APP_URL` est facultative sur le Web, qui utilise son origine courante. Après déploiement, la définir avec l'URL HTTPS publique afin que les partages lancés depuis Android/iOS pointent vers la page Web, et non vers le seul deep link `athar://`.

Le préfixe `EXPO_PUBLIC_` signifie que la valeur est incorporée au bundle. La publishable key est conçue pour le client, mais elle ne remplace jamais la RLS. Ne jamais utiliser `service_role`, une Supabase secret key ou un jeton d'administration dans cette application.

## Configuration Supabase

1. Créer un projet depuis le tableau de bord Supabase.
2. Dans **Authentication**, activer **Anonymous Sign-Ins**. En production, ajouter une protection anti-abus adaptée (CAPTCHA/Turnstile et limites) et prévoir le nettoyage des comptes anonymes expirés.
3. Appliquer les migrations versionnées :

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

4. Copier l'URL du projet et sa **Publishable key** dans `.env.local`, puis redémarrer Expo.
5. `supabase/seed.sql` contient uniquement une fixture de développement local. Ne jamais l’exécuter sur un projet distant ou en production.

Pour une base locale, Docker doit fonctionner :

```bash
npx supabase start
npx supabase db reset
```

La migration `supabase/migrations/202608010001_initial_schema.sql` crée `dedications`, `reading_progress` et `bookmarks`, leurs contraintes et la RLS. La lecture publique d'une dédicace active passe uniquement par `get_public_dedication(slug)` : aucun droit `SELECT` public ne doit permettre d'énumérer la table.

Avant toute mise en production, tester au minimum avec deux sessions distinctes :

- un visiteur peut lire exactement une dédicace active dont il connaît le slug ;
- un visiteur ne peut ni lister les dédicaces, ni lire une page désactivée ;
- seul le créateur peut modifier, désactiver ou supprimer sa dédicace ;
- favoris et progression ne sont lisibles et modifiables que par leur propriétaire.

Une session anonyme est liée au stockage de l'appareil. Si l'utilisateur efface ses données avant d'avoir un compte permanent, il peut perdre l'accès de gestion ; cette limite doit rester visible dans l'interface.

## Provenance du Coran

Les entrées approuvées proviennent de [Tanzil](https://tanzil.net/download/) : texte Uthmani et texte Simple Clean version 1.1, plus les métadonnées XML version 1.0. Les conditions d'utilisation et la notice de redistribution sont reproduites dans `assets/quran/SOURCE.md`; la preuve machine, la date d'import et les empreintes se trouvent dans `assets/quran/source-receipt.json`.

Empreintes attendues des fichiers originaux :

| Fichier                  | Usage                                 | SHA-256 attendu                                                    |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `quran-uthmani.txt`      | affichage, jamais normalisé           | `6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f` |
| `quran-simple-clean.txt` | base vérifiée de l'index de recherche | `228df2a717671aeb9d2ff573002bd28d6b3f973f4bc7153554e3a81663d67610` |
| `quran-data.xml`         | noms et comptages vérifiés            | `8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a` |

L'empreinte agrégée des artefacts générés validés est `8ee5a5a6c5cedf6ffc377131be8ead787dc046f5a896c1cdd13fd39d01084f2c`.

Procédure reproductible :

1. Télécharger manuellement les variantes exactes depuis le formulaire officiel Tanzil et accepter explicitement sa notice. Ne pas remplacer un fichier par un miroir au nom similaire.
2. Placer les trois fichiers, sans les ouvrir dans un éditeur qui pourrait réencoder le texte, dans `assets/quran/source/`.
3. Comparer leurs SHA-256 avec le tableau et `source-receipt.json` :

   ```bash
   sha256sum assets/quran/source/quran-uthmani.txt \
     assets/quran/source/quran-simple-clean.txt \
     assets/quran/source/quran-data.xml
   ```

4. Générer puis contrôler les artefacts :

   ```bash
   npm run import:quran
   npm run validate:quran
   ```

5. Examiner le diff. Tout changement du champ Uthmani, des empreintes, des 114 sourates, de la continuité des ayat ou des comptages bloque la publication jusqu'à revue humaine de la source.

La basmala suit exactement le format Tanzil `txt-2` : `1:1` est la basmala d'Al-Fatiha ; pour les sourates autres que 1 et 9, elle est préfixée sur la même ligne que l'ayah 1 et ne devient pas un verset supplémentaire ; `9:1` n'en contient pas. L'import ne la découpe ni ne la réécrit.

Le fichier Uthmani est la seule valeur affichée. `search-index.json` est une donnée dérivée distincte : sa normalisation ne doit jamais être réinjectée dans l'affichage. Une source non vérifiée, absente ou dont le checksum diffère doit faire échouer l'import ; il est interdit de la remplacer par du faux texte.

## Vérifications

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run validate:quran
npx expo export --platform web
```

Pour installer le navigateur Playwright sur une nouvelle machine :

```bash
npx playwright install chromium
```

L'export de production est écrit dans `dist/`. Il faut ensuite tester le bundle et ouvrir directement au moins une route dynamique dans une fenêtre privée :

```bash
npm run build:web
npm run serve:web
```

Le petit serveur de prévisualisation fourni applique le fallback SPA localement ; il permet donc de tester réellement les routes dynamiques après rechargement.

Les tests automatisés ne remplacent pas la vérification sur Expo Go. Toute commande absente ou en échec constitue un travail restant ; elle ne doit pas être présentée comme validée.

## Export Web SPA

Les dédicaces Supabase ont des slugs inconnus au moment du build. Le Web doit donc être exporté en SPA avec `expo.web.output: "single"`, puis chaque hébergeur doit réécrire les chemins inconnus vers `/index.html`. Sans cette règle, un rechargement direct de `/dedication/<slug>` renvoie une 404.

```bash
npx expo export --platform web
```

Le dépôt fournit :

- `netlify.toml` pour Netlify ;
- `vercel.json` pour Vercel ;
- `public/_redirects`, copié dans `dist/`, pour Netlify et Cloudflare Pages.

Après chaque déploiement, tester depuis une nouvelle session navigateur l'accueil, `/dedication/<slug>`, `/manage/<slug>` et une route de sourate, puis recharger chaque page.

## EAS Hosting et builds natifs

Installer et initialiser EAS sans inscrire de faux identifiant de projet dans Git :

```bash
npm install --global eas-cli
eas login
eas init
```

Déployer un aperçu Web puis promouvoir un export vérifié :

```bash
npx expo export --platform web
eas deploy
eas deploy --prod
```

La CLI affiche l'URL publique `expo.app`; aucun domaine personnalisé n'est requis pour le MVP. Refaire l'export après chaque changement. Les variables `EXPO_PUBLIC_*` nécessaires doivent être présentes pendant l'export, puisqu'elles sont intégrées au JavaScript livré.

Attention : la documentation EAS Hosting publiée pour la version actuelle mentionne officiellement les sorties `static` et `server`, tandis que ce MVP exige `single` pour les slugs arbitraires. Valider `eas deploy` sur le compte Expo avant d'annoncer EAS Hosting comme cible opérationnelle. Si la CLI refuse ce format, conserver la SPA sur l'un des hébergeurs externes ci-dessous ou adapter explicitement l'architecture à `server` ; ne pas passer silencieusement à `static`, qui ne peut pas pré-générer les futurs slugs Supabase.

`eas.json` prépare également les futurs binaires :

```bash
eas build --platform android --profile preview      # APK interne
eas build --platform android --profile production   # AAB Play Store
eas build --platform ios --profile production       # archive App Store
```

Avant le premier build signé, choisir et ajouter un `android.package` et un `ios.bundleIdentifier` uniques dans `app.json`. Le test quotidien du MVP reste Expo Go ; un development build nécessiterait `expo-dev-client`, qui ne doit pas être ajouté sans besoin natif réel.

## Hébergeurs Web externes

### Netlify

Le projet Git est prêt avec la commande `npx expo export --platform web` et le dossier publié `dist`. En CLI :

```bash
npx netlify-cli deploy --dir dist
npx netlify-cli deploy --dir dist --prod
```

`netlify.toml` et `public/_redirects` appliquent le fallback SPA.

### Vercel

`vercel.json` définit l'export, `dist` et la rewrite SPA :

```bash
npx vercel
npx vercel --prod
```

### Cloudflare Pages

Dans Pages, utiliser `npx expo export --platform web` comme commande de build et `dist` comme répertoire de sortie. Le fichier `public/_redirects` est copié pendant l'export et fournit le fallback SPA. En CLI, après création du projet Pages :

```bash
npx wrangler pages deploy dist --project-name athar-mushaf
```

Ne pas ajouter de Pages Functions sans revoir `_redirects` : Cloudflare ne lui applique pas ces règles lorsqu'une Function intercepte la route.

## Confidentialité et limites

Le MVP ne collecte ni adresse, ni téléphone, ni date de naissance, ni localisation, ni contacts. Il ne contient ni publicité, ni paiement, ni outil de profilage, ni annuaire public. Les noms et messages saisis sont des contenus utilisateur, validés et séparés du corpus. La progression de lecture et les favoris sont privés : locaux en mode démonstration, puis synchronisés sous RLS avec la session anonyme en mode connecté.

Les évolutions envisagées et leurs conditions de provenance, licence et consentement figurent dans `ROADMAP.md`.

## Références officielles

- [Publication Web avec Expo](https://docs.expo.dev/guides/publishing-websites/)
- [EAS Hosting](https://docs.expo.dev/deploy/web/)
- [Configuration `eas.json`](https://docs.expo.dev/build/eas-json/)
- [Supabase pour Expo React Native](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Sessions anonymes Supabase](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Redirections Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/redirects/)
