export type AdminNavItem={label:string;href:string;ready:boolean};export type AdminNavGroup={label:string;items:AdminNavItem[]};
export const ADMIN_NAV_GROUPS:AdminNavGroup[]=[
{label:"Vue générale",items:[{label:"Vue d’ensemble",href:"/admin",ready:true},{label:"Analytique globale",href:"/admin/analytics",ready:true}]},
{label:"Marketplace",items:[{label:"Utilisateurs",href:"/admin/utilisateurs",ready:true},{label:"Vendeurs",href:"/admin/vendeurs",ready:true},{label:"Boutiques",href:"/admin/boutiques",ready:true},{label:"Produits",href:"/admin/produits",ready:true}]},
{label:"Opérations",items:[{label:"Commandes",href:"/admin/commandes",ready:true},{label:"Livraisons",href:"/admin/livraisons",ready:true},{label:"Vérification KYC",href:"/admin/kyc",ready:true},{label:"Avis & signalements",href:"/admin/avis",ready:true}]},
{label:"Finance",items:[{label:"Vue financière",href:"/admin/finance",ready:true},{label:"Paiements",href:"/admin/paiements",ready:true},{label:"Retraits",href:"/admin/retraits",ready:true},{label:"Abonnements",href:"/admin/abonnements",ready:true}]},
{label:"Communication",items:[{label:"Messages",href:"/admin/messages",ready:true},{label:"WhatsApp Business",href:"/admin/whatsapp",ready:true}]},
{label:"Croissance & sécurité",items:[{label:"Promotions",href:"/admin/promotions",ready:true},{label:"Parrainages",href:"/admin/parrainages",ready:true},{label:"Sécurité & appareils",href:"/admin/securite",ready:true}]},
{label:"Configuration",items:[{label:"Centre de configuration",href:"/admin/parametres",ready:true}]}
];
export const ADMIN_NAV:AdminNavItem[]=ADMIN_NAV_GROUPS.flatMap(g=>g.items);export const ADMIN_STUB_REQUIREMENTS:Record<string,string>={};
