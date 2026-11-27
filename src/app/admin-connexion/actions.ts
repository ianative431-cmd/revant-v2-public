"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_ERROR_MESSAGE } from "@/server/security/rate-limit";
import { createAccessKeySalt, createDeviceToken, digestDeviceToken, digestSuperAdminAccessKey, hasAal2, hasVerifiedTotp, isSuperAdminUser, normalizeAdminName, safeDigestEqual } from "@/server/auth/super-admin";

export type AdminLoginState = { error: string | null };
const genericLoginError = "Identifiants incorrects ou accès non autorisé.";
const DEVICE_COOKIE = process.env.NODE_ENV === "production" ? "__Host-revant-super-admin-device" : "revant-super-admin-device";
const DEVICE_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 60 * 60 * 24 * 365 };
const validName = (v:string) => v.trim().length >= 2 && v.trim().length <= 60;

async function getCurrentSuperAdmin(){const supabase=await createSupabaseServerClient();const {data:{user},error}=await supabase.auth.getUser();if(error||!user||!(await isSuperAdminUser(user.id)))return null;return {supabase,user};}

async function registerOrCheckDevice(userId:string,deviceName:string){
  const db=createSupabaseAdminClient();const store=await cookies();const token=store.get(DEVICE_COOKIE)?.value;
  if(token){const {data:existing}=await db.from("super_admin_devices").select("id,status").eq("user_id",userId).eq("device_token_digest",digestDeviceToken(token)).maybeSingle();if(existing?.status==="approved"){await db.from("super_admin_devices").update({last_seen_at:new Date().toISOString()}).eq("id",existing.id);redirect("/admin");}if(existing?.status==="pending")redirect("/admin-connexion/appareil-en-attente");store.delete(DEVICE_COOKIE);}
  // A fresh device must never approve itself, even if every previously trusted device was revoked.
  // The one-time bootstrap path explicitly registers the first trusted device in configureSuperAdminIdentity.
  const fresh=createDeviceToken();const status="pending";
  const {error}=await db.from("super_admin_devices").insert({user_id:userId,device_name:deviceName,device_token_digest:digestDeviceToken(fresh),status,approved_at:null,last_seen_at:new Date().toISOString()});
  if(error)return {error:"Impossible d'enregistrer cet appareil."};store.set(DEVICE_COOKIE,fresh,DEVICE_COOKIE_OPTIONS);if(status==="pending")redirect("/admin-connexion/appareil-en-attente");redirect("/admin");
}

export async function signInSuperAdmin(_prev:AdminLoginState,formData:FormData):Promise<AdminLoginState>{
  const username=String(formData.get("username")??"").trim(),key=String(formData.get("accessKey")??"");
  if(!validName(username)||!/^[a-f0-9]{64}$/i.test(key))return {error:genericLoginError};
  const normalizedUsername=normalizeAdminName(username);
  const ip=await getClientIdentifier();const checks=[checkRateLimit("super-admin-login:"+normalizedUsername,5,900)];if(ip!=="unknown")checks.push(checkRateLimit("super-admin-login:ip:"+ip,10,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const db=createSupabaseAdminClient();const {data:identities,error:identityError}=await db.from("super_admin_identities").select("user_id,access_key_salt,access_key_digest").eq("first_name_normalized",normalizedUsername).eq("last_name_normalized",normalizeAdminName("Super Admin")).limit(2);
  if(identityError||!identities?.length)return {error:genericLoginError};const identity=identities[0];if(!safeDigestEqual(digestSuperAdminAccessKey(key,identity.access_key_salt),identity.access_key_digest)||!(await isSuperAdminUser(identity.user_id)))return {error:genericLoginError};
  const {data:authResult,error:authError}=await db.auth.admin.getUserById(identity.user_id);const email=authResult.user?.email;if(authError||!email)return {error:genericLoginError};
  // Supabase Auth remains the authentication authority: the 256-bit secret is also its password.
  const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.signInWithPassword({email,password:key});if(error)return {error:genericLoginError};const {data:{user}}=await supabase.auth.getUser();if(!user||user.id!==identity.user_id||!(await isSuperAdminUser(user.id))){await supabase.auth.signOut();return {error:genericLoginError};}
  if(!(await hasVerifiedTotp(supabase)))redirect("/admin-connexion/securite");redirect("/admin-connexion/mfa");
}
/** One-time transition through the existing Supabase Auth account. Google OAuth is not offered. */
export async function signInInitialSuperAdmin(_prev:AdminLoginState,_formData:FormData):Promise<AdminLoginState>{return {error:"La connexion initiale par mot de passe est désactivée. Utilise la vérification par e-mail."};}

export async function beginSuperAdminTotpEnrollment(){return {error:"L’enrôlement TOTP doit passer par la preuve e-mail initiale.",factorId:null,qrCode:null,secret:null,alreadyVerified:false};}

export async function verifySuperAdminTotpEnrollment(_prev:AdminLoginState,_formData:FormData):Promise<AdminLoginState>{return {error:"Ancien parcours désactivé. Recommence la configuration sécurisée."};}

export async function verifySuperAdminMfa(formData:FormData){
  const code=String(formData.get("code")??"").trim(),deviceName=String(formData.get("deviceName")??"").trim(),next=String(formData.get("next")??"admin");if(!/^\d{6,8}$/.test(code)||deviceName.length<2||deviceName.length>80)return {error:"Code ou nom d'appareil invalide."};const current=await getCurrentSuperAdmin();if(!current)return {error:"Session expirée. Recommence la connexion."};
  const ip=await getClientIdentifier();const checks=[checkRateLimit(`super-admin-mfa:${current.user.id}`,5,900)];if(ip!=="unknown")checks.push(checkRateLimit(`super-admin-mfa:ip:${ip}`,10,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const {data:factors,error:factorsError}=await current.supabase.auth.mfa.listFactors();if(factorsError||!factors)return {error:"Impossible de vérifier les facteurs de sécurité."};const factor=factors.totp.find(f=>f.status==="verified");if(!factor)redirect("/admin-connexion/securite");
  const {data:challenge,error:challengeError}=await current.supabase.auth.mfa.challenge({factorId:factor.id});if(challengeError||!challenge)return {error:"Impossible de vérifier le code."};const {error}=await current.supabase.auth.mfa.verify({factorId:factor.id,challengeId:challenge.id,code});if(error||!(await hasAal2(current.supabase)))return {error:"Code incorrect ou authentification renforcée non confirmée."};if(next==="setup")redirect("/admin-connexion/configurer");return registerOrCheckDevice(current.user.id,deviceName);
}

export async function configureSuperAdminIdentity(_prev:AdminLoginState,_formData:FormData):Promise<AdminLoginState>{return {error:"Ancien parcours désactivé. Recommence la configuration sécurisée."};}
async function trustedDeviceId(userId:string){const token=(await cookies()).get(DEVICE_COOKIE)?.value;if(!token)return null;const db=createSupabaseAdminClient();const {data}=await db.from("super_admin_devices").select("id").eq("user_id",userId).eq("device_token_digest",digestDeviceToken(token)).eq("status","approved").maybeSingle();return data?.id??null;}
export async function approveSuperAdminDevice(formData:FormData){const id=String(formData.get("deviceId")??"");const current=await getCurrentSuperAdmin();if(!current||!(await hasAal2(current.supabase))||!(await trustedDeviceId(current.user.id)))return;const db=createSupabaseAdminClient();const {data:target}=await db.from("super_admin_devices").select("id,device_name").eq("id",id).eq("user_id",current.user.id).eq("status","pending").maybeSingle();if(!target)return;await db.from("super_admin_devices").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",target.id);await db.from("admin_actions").insert({admin_id:current.user.id,action:"super_admin_device_approved",target_type:"super_admin_device",target_id:target.id,reason:"Appareil approuvé depuis un appareil de confiance",metadata:{device_name:target.device_name}});revalidatePath("/admin/securite/appareils");}
export async function revokeSuperAdminDevice(formData:FormData){const id=String(formData.get("deviceId")??"");const current=await getCurrentSuperAdmin();if(!current||!(await hasAal2(current.supabase))||!(await trustedDeviceId(current.user.id)))return;const db=createSupabaseAdminClient();const {data:target}=await db.from("super_admin_devices").select("id,device_name,device_token_digest").eq("id",id).eq("user_id",current.user.id).eq("status","approved").maybeSingle();if(!target)return;const token=(await cookies()).get(DEVICE_COOKIE)?.value;if(token&&digestDeviceToken(token)===target.device_token_digest)return;await db.from("super_admin_devices").update({status:"revoked",revoked_at:new Date().toISOString()}).eq("id",target.id);await db.from("admin_actions").insert({admin_id:current.user.id,action:"super_admin_device_revoked",target_type:"super_admin_device",target_id:target.id,reason:"Appareil révoqué depuis un appareil de confiance",metadata:{device_name:target.device_name}});revalidatePath("/admin/securite/appareils");}
export async function signOutSuperAdminAction(){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();const wasSuperAdmin=user?await isSuperAdminUser(user.id):false;await supabase.auth.signOut();redirect(wasSuperAdmin?"/admin-connexion":"/connexion");}
