# Revant Chat — cahier des charges de la mise à niveau majeure

## Décision produit
La messagerie Revant devient une expérience complète inspirée des usages modernes de WhatsApp, avec une identité Revant Tangerine, cohérente en mode clair et sombre. Les illustrations de référence validées dans la conception doivent guider les écrans : boîte de réception, conversation, panneau de pièces jointes, vocaux, vidéo et cartes commerciales. Elles servent de référence visuelle ; les écrans finaux seront des composants React accessibles et fonctionnels, pas des images statiques.

## Écrans à matérialiser

### 1. Boîte de réception
- En-tête Revant Chat avec avatar, titre et actions.
- Recherche instantanée dans les conversations.
- Filtres : Toutes, Non lues, Acheteurs, Vendeurs, Commandes.
- Lignes de conversation avec avatar, nom boutique/correspondant, aperçu typé (texte/photo/vidéo/vocal/produit/commande), heure, badge non lu et statut.
- Conversations épinglées et archivées.
- État vide illustré et appel à découvrir les boutiques.

### 2. Fil de conversation
- En-tête avec retour, avatar, nom, statut en ligne/dernière activité uniquement si autorisé par les paramètres de confidentialité, et menu d'actions.
- Bulles entrantes/sortantes distinctes, dates séparatrices, heures, états envoyé/distribué/lu.
- Réponse ciblée, réactions emoji, copie, transfert, suppression selon les droits et recherche dans la conversation.
- Zone de saisie fixe, clavier mobile compatible, prévisualisation des pièces jointes et envoi texte sans rechargement complet.

### 3. Pièces jointes
- Panneau + : caméra, galerie/photos, vidéos, documents et position.
- Sélection multiple, aperçu avant envoi, progression, annulation, gestion des échecs et limites de taille/type.
- Images consultables en plein écran ; vidéo lisible dans le fil et en plein écran ; documents avec nom, type et taille.

### 4. Vocaux
- Appui pour enregistrer, verrouillage mains libres, annulation avant envoi.
- Onde sonore, durée, lecture/pause, progression et vitesses 1x/1,5x/2x.
- Permission microphone explicite et retours d'erreur accessibles.

### 5. Fonctions commerce Revant
- Carte produit partageable (image, titre, prix, lien et disponibilité vérifiée).
- Carte boutique partageable (nom, logo, badges, lien).
- Carte commande/suivi visible uniquement aux participants autorisés.
- Assistance Revant avec possibilité de joindre une capture ou vidéo.

### 6. Fonctions avancées
- Notifications temps réel, indicateur de saisie, présence, accusés de réception.
- Épingler/archiver, bloquer/signaler, réglages de confidentialité.
- Partage de position sur consentement explicite et durée contrôlée.
- Appels audio/vidéo : phase séparée avec WebRTC, signalisation et TURN ; ne pas présenter comme opérationnels avant infrastructure et tests réseau.

## Direction artistique
- Réutiliser les tokens Revant et le sélecteur de thème situé exclusivement dans Paramètres > Apparence.
- Mode clair : surfaces lumineuses, textes foncés, accents orange nets.
- Mode sombre : surfaces bleu ardoise différenciées, textes clairs, accents orange lumineux.
- Animations : arrivée des messages, réactions, ouverture du panneau +, aperçu média, enregistrement vocal, changement d'écran et états de chargement.
- Respect de `prefers-reduced-motion`, focus clavier, lecteurs d'écran et appareils mobiles modestes.
- Mise en page responsive : mobile d'abord ; vue deux panneaux sur grands écrans.

## État technique constaté avant développement
- Tables `conversations` et `messages` présentes.
- `messages` contient actuellement `body`, `type`, `product_id`, `order_id`, `sender_id`, `conversation_id`, `created_at`.
- Enum `message_type` actuellement limité à `text`, `order_link`, `product_link`.
- Actions existantes : envoi texte et démarrage de conversation depuis un produit.
- Pages existantes : liste et fil de conversation, rendus côté serveur.
- Aucun schéma de pièce jointe/média, vocal, accusé de lecture, présence ou statut de saisie n'a été identifié dans les types/migrations examinés.
- Aucun bucket privé de messagerie ni politique d'accès aux médias de chat n'a été identifié dans les migrations examinées.

## Plan de réalisation sécurisé
1. UX/UI : matérialiser les deux écrans, composants responsive, états vides, filtres et panneau de pièces jointes (sans simuler un envoi réel).
2. Modèle média : migration SQL additive pour pièces jointes et métadonnées, bucket privé, politiques RLS limitées aux participants, validation serveur type/taille et URLs signées.
3. Envoi média : photos, vidéos et documents avec prévisualisation, progression, annulation et contrôles de sécurité.
4. Vocaux : capture navigateur/mobile, stockage privé et lecteur accessible.
5. Temps réel : abonnements sécurisés, reçus de lecture, présence et saisie, après vérification des politiques et coûts.
6. Cartes commerciales et assistance : lier les données existantes côté serveur, ne jamais faire confiance aux prix ou statuts fournis par le client.
7. Appels audio/vidéo : étude et infrastructure dédiées, étape indépendante.

## Garde-fous
- Ne pas exposer de médias privés par URL publique permanente.
- Ne jamais faire confiance au client pour les identités, droits, prix, disponibilité ou état de commande.
- Toutes les opérations doivent vérifier l'appartenance de l'utilisateur à la conversation.
- Ne pas modifier les paiements, le portefeuille, les rôles Admin/Super Admin ou les règles de commandes pour cette évolution.
- Ne pas afficher une fonction comme active tant que son backend n'est pas implémenté et testé.
- Vérifier lint, tests, build, migrations et tests RLS avant déploiement.
