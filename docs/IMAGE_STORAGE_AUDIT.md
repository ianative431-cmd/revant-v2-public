# Audit du stockage des images Revant

État vérifié le 2 novembre 2026 sur le projet Supabase Revant.

## État réel de la base et des buckets

- Buckets publics disponibles : `product-images` (10 Mo maximum) et `shop-media` (10 Mo maximum).
- Formats autorisés par ces buckets : JPEG, PNG et WebP.
- Les deux buckets ne contiennent actuellement aucun fichier.
- La base contient 10 catégories actives, mais aucune n'a de `image_url`.
- Les tables `shops`, `products` et `product_images` ne contiennent actuellement aucune ligne.

Aucun produit, vendeur, logo, bannière ou image de catégorie fictif n'a été ajouté pour maquiller l'état de la plateforme.

## Règle Storage effectivement déployée

Les policies actives sur `storage.objects` pour `product-images` et `shop-media` contrôlent le premier segment du chemin d'upload : il doit correspondre à `auth.uid()`. Les modifications et suppressions sont également limitées aux objets dont `owner_id` correspond à l'utilisateur connecté.

## Correction de l'upload des photos produits

L'ancien helper générait `{shop_id}/{timestamp}.jpg`, alors que la policy active exige `{owner_id}/...`. Le chemin est maintenant :

```
{owner_id}/{shop_id}/{timestamp}-{index}.jpg
```

Le formulaire reçoit l'identifiant du propriétaire depuis la page serveur authentifiée. Il ne se fie pas à une valeur saisie par le navigateur pour déterminer l'identité du vendeur.

## Logo et bannière de boutique

La page de personnalisation permet désormais d'envoyer le logo et la bannière :
- contrôle du type JPEG/PNG/WebP et d'une taille initiale maximale de 8 Mo ;
- redimensionnement et compression locale en JPEG avant transfert ;
- chemin `{owner_id}/{shop_id}/{type}-{timestamp}.jpg`, conforme à la policy Storage active ;
- mise à jour de `shops.logo_url` ou `shops.banner_url` via la session authentifiée et les policies RLS ;
- suppression du nouveau fichier si la mise à jour de la boutique échoue.

Le bucket `shop-media` est public pour permettre l'affichage des visuels sur la vitrine publique. La clé `service_role` n'est pas utilisée côté navigateur.

## Affichage

- `next.config.ts` autorise les images publiques servies par le domaine Supabase configuré.
- Les fiches produits lisent les URL de `product_images` triées par `sort_order`.
- La vitrine publique affiche le logo et la bannière enregistrés sur la boutique.
- L'accueil utilise `categories.image_url` lorsqu'il est renseigné et garde une image de secours lorsqu'il est vide ou invalide.

## Limite de recette

Les tables boutiques et produits étant vides et les buckets ne contenant aucun fichier, un upload réel de bout en bout ne peut pas encore être déclaré réussi. Il faudra le tester après création d'une boutique réelle avec un compte vendeur autorisé, puis vérifier l'objet Storage, les URL publiques et l'affichage mobile/desktop.
