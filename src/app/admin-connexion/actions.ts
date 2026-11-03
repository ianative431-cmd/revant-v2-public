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
const validPassword = (v:string) => v.length >= 12 && v.length <= 128;

async function getCurrentSuperAdmin(){const supabase=await createSupabaseServerClient();const {data:{user},error}=await supabase.auth.getUser();if(error||!user||!(await isSuperAdminUser(user.id)))return null;return {supabase,user};}

async function registerOrCheckDevice(userId:string,deviceName:string){
  const db=createSupabaseAdminClient();const store=await cookies();const token=store.get(DEVICE_COOKIE)?.value;
  if(token){const {data:existing}=await db.from("super_admin_devices").select("id,status").eq("user_id",userId).eq("device_token_digest",digestDeviceToken(token)).maybeSingle();if(existing?.status==="approved"){await db.from("super_admin_devices").update({last_seen_at:new Date().toISOString()}).eq("id",existing.id);redirect("/admin");}if(existing?.status==="pending")redirect("/admin-connexion/appareil-en-attente");store.delete(DEVICE_COOKIE);}
  const {count,error:countError}=await db.from("super_admin_devices").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("status","approved");if(countError)return {error:"Impossible de vérifier les appareils autorisés."};
  const fresh=createDeviceToken();const status=(count??0)===0?"approved":"pending";
  const {error}=await db.from("super_admin_devices").insert({user_id:userId,device_name:deviceName,device_token_digest:digestDeviceToken(fresh),status,approved_at:status==="approved"?new Date().toISOString():null,last_seen_at:new Date().toISOString()});
  if(error)return {error:"Impossible d'enregistrer cet appareil."};store.set(DEVICE_COOKIE,fresh,DEVICE_COOKIE_OPTIONS);if(status==="pending")redirect("/admin-connexion/appareil-en-attente");redirect("/admin");
}

export async function signInSuperAdmin(_prev:AdminLoginState,formData:FormData):Promise<AdminLoginState>{
  const first=String(formData.get("firstName")??"").trim(),last=String(formData.get("lastName")??"").trim(),key=String(formData.get("accessKey")??""),password=String(formData.get("password")??"");
  if(!validName(first)||!validName(last)||!/^[a-f0-9]{64}$/i.test(key)||!validPassword(password))return {error:genericLoginError};
  const ip=await getClientIdentifier();const checks=[checkRateLimit(`super-admin-login:${normalizeAdminName(first)}:${normalizeAdminName(last)}`,5,900)];if(ip!=="unknown")checks.push(checkRateLimit(`super-admin-login:ip:${ip}`,10,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const db=createSupabaseAdminClient();const {data:identities,error:identityError}=await db.from("super_admin_identities").select("user_id,access_key_salt,access_key_digest").eq("first_name_normalized",normalizeAdminName(first)).eq("last_name_normalized",normalizeAdminName(last)).limit(2);
  if(identityError||!identities?.length)return {error:genericLoginError};const identity=identities[0];if(!safeDigestEqual(digestSuperAdminAccessKey(key,identity.access_key_salt),identity.access_key_digest)||!(await isSuperAdminUser(identity.user_id)))return {error:genericLoginError};
  const {data:authResult,error:authError}=await db.auth.admin.getUserById(identity.user_id);const email=authResult.user?.email;if(authError||!email)return {error:genericLoginError};
  const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)return {error:genericLoginError};const {data:{user}}=await supabase.auth.getUser();if(!user||user.id!==identity.user_id||!(await isSuperAdminUser(user.id))){await supabase.auth.signOut();return {error:genericLoginError};}
  if(!(await hasVerifiedTotp(supabase)))redirect("/admin-connexion/securite");redirect("/admin-connexion/mfa");
}

/** One-time transition through the existing Supabase Auth account. Google OAuth is not offered. */
export async function signInInitialSuperAdmin(_prev:AdminLoginState,formData:FormData):Promise<AdminLoginState>{
  const email=String(formData.get("email")??"").trim().toLowerCase(),password=String(formData.get("password")??"");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!password||password.length>128)return {error:genericLoginError};
  const db=createSupabaseAdminClient();const {count,error:countError}=await db.from("super_admin_identities").select("user_id",{count:"exact",head:true});if(countError||(count??0)>0)return {error:"La première configuration est déjà terminée."};
  const ip=await getClientIdentifier();const checks=[checkRateLimit(`super-admin-bootstrap:${email}`,3,900)];if(ip!=="unknown")checks.push(checkRateLimit(`super-admin-bootstrap:ip:${ip}`,6,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const supabase=await createSupabaseServerClient();const {error}=await supabase.auth.signInWithPassword({email,password});if(error)return {error:genericLoginError};const {data:{user}}=await supabase.auth.getUser();if(!user||!(await isSuperAdminUser(user.id))){await supabase.auth.signOut();return {error:genericLoginError};}
  if(!(await hasVerifiedTotp(supabase)))redirect("/admin-connexion/securite");redirect("/admin-connexion/mfa?next=setup");
}

export async function beginSuperAdminTotpEnrollment(){
  const current=await getCurrentSuperAdmin();if(!current)redirect("/admin-connexion/initialiser");const {data:factors,error:factorsError}=await current.supabase.auth.mfa.listFactors();if(factorsError||!factors)return {error:"Impossible de vérifier les facteurs de sécurité."};
  const verified=factors.totp.find(f=>f.status==="verified");if(verified)return {error:null,factorId:verified.id,qrCode:null,secret:null,alreadyVerified:true};
  for(const factor of factors.all.filter(f=>f.factor_type==="totp"&&f.status==="unverified"))await current.supabase.auth.mfa.unenroll({factorId:factor.id});
  const {data,error}=await current.supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"Revant Super Admin"});if(error||!data?.totp)return {error:"Impossible de préparer l'authentification à deux facteurs."};return {error:null,factorId:data.id,qrCode:data.totp.qr_code,secret:data.totp.secret,alreadyVerified:false};
}

export async function verifySuperAdminTotpEnrollment(_prev:AdminLoginState,formData:FormData):Promise<AdminLoginState>{
  const factorId=String(formData.get("factorId")??""),code=String(formData.get("code")??"").trim();if(!factorId||!/^\d{6,8}$/.test(code))return {error:"Code invalide."};const current=await getCurrentSuperAdmin();if(!current)return {error:"Session expirée. Recommence la connexion."};
  const ip=await getClientIdentifier();const checks=[checkRateLimit(`super-admin-totp-enroll:${current.user.id}`,5,900)];if(ip!=="unknown")checks.push(checkRateLimit(`super-admin-totp-enroll:ip:${ip}`,10,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const {data:challenge,error:challengeError}=await current.supabase.auth.mfa.challenge({factorId});if(challengeError||!challenge)return {error:"Impossible de vérifier le code."};const {error}=await current.supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code});if(error||!(await hasAal2(current.supabase)))return {error:"Code incorrect ou authentification renforcée non confirmée."};
  const db=createSupabaseAdminClient();const {data:identity}=await db.from("super_admin_identities").select("user_id").eq("user_id",current.user.id).maybeSingle();if(identity)redirect("/admin-connexion/mfa");redirect("/admin-connexion/configurer");
}

export async function verifySuperAdminMfa(formData:FormData){
  const code=String(formData.get("code")??"").trim(),deviceName=String(formData.get("deviceName")??"").trim(),next=String(formData.get("next")??"admin");if(!/^\d{6,8}$/.test(code)||deviceName.length<2||deviceName.length>80)return {error:"Code ou nom d'appareil invalide."};const current=await getCurrentSuperAdmin();if(!current)return {error:"Session expirée. Recommence la connexion."};
  const ip=await getClientIdentifier();const checks=[checkRateLimit(`super-admin-mfa:${current.user.id}`,5,900)];if(ip!=="unknown")checks.push(checkRateLimit(`super-admin-mfa:ip:${ip}`,10,900));if((await Promise.all(checks)).some(x=>!x))return {error:RATE_LIMIT_ERROR_MESSAGE};
  const {data:factors,error:factorsError}=await current.supabase.auth.mfa.listFactors();if(factorsError||!factors)return {error:"Impossible de vérifier les facteurs de sécurité."};const factor=factors.totp.find(f=>f.status==="verified");if(!factor)redirect("/admin-connexion/securite");
  const {data:challenge,error:challengeError}=await current.supabase.auth.mfa.challenge({factorId:factor.id});if(challengeError||!challenge)return {error:"Impossible de vérifier le code."};const {error}=await current.supabase.auth.mfa.verify({factorId:factor.id,challengeId:challenge.id,code});if(error||!(await hasAal2(current.supabase)))return {error:"Code incorrect ou authentification renforcée non confirmée."};if(next==="setup")redirect("/admin-connexion/configurer");return registerOrCheckDevice(current.user.id,deviceName);
}

export async function configureSuperAdminIdentity(_prev:AdminLoginState,formData:FormData):Promise<AdminLoginState>{
  const first=String(formData.get("firstName")??"").trim(),last=String(formData.get("lastName")??"").trim(),key=String(formData.get("accessKey")??""),password=String(formData.get("password")??""),confirmation=String(formData.get("confirmation")??""),deviceName=String(formData.get("deviceName")??"").trim();
  if(!validName(first)||!validName(last)||!/^[a-f0-9]{64}$/i.test(key)||!validPassword(password)||password!==confirmation||deviceName.length<2||deviceName.length>80)return {error:"Vérifie les champs : clé aléatoire de 64 caractères, mot de passe de 12 caractères minimum et confirmation identique."};
  const current=await getCurrentSuperAdmin();if(!current||!(await hasAal2(current.supabase)))return {error:"Authentification renforcée requise. Recommence la configuration."};const db=createSupabaseAdminClient();const {count,error:countError}=await db.from("super_admin_identities").select("user_id",{count:"exact",head:true});if(countError||(count??0)>0)return {error:"La première configuration est déjà terminée."};
  const salt=createAccessKeySalt();const {error:insertError}=await db.from("super_admin_identities").insert({user_id:current.user.id,first_name:first,last_name:last,first_name_normalized:normalizeAdminName(first),last_name_normalized:normalizeAdminName(last),access_key_salt:salt,access_key_digest:digestSuperAdminAccessKey(key,salt)});if(insertError)return {error:"Impossible d'enregistrer les identifiants. Vérifie que la migration de sécurité est appliquée."};
  const {error:passwordError}=await current.supabase.auth.updateUser({password});if(passwordError){await db.from("super_admin_identities").delete().eq("user_id",current.user.id);return {error:"Impossible de mettre à jour le mot de passe. Aucun identifiant n'a été conservé."};}
  const token=createDeviceToken();const {error:deviceError}=await db.from("super_admin_devices").insert({user_id:current.user.id,device_name:deviceName,device_token_digest:digestDeviceToken(token),status:"approved",approved_at:new Date().toISOString(),last_seen_at:new Date().toISOString()});if(deviceError){await db.from("super_admin_identities").delete().eq("user_id",current.user.id);return {error:"Impossible d'enregistrer le premier appareil. Vérifie la migration et réessaie."};}
  (await cookies()).set(DEVICE_COOKIE,token,DEVICE_COOKIE_OPTIONS);await current.supabase.auth.signOut();redirect("/admin-connexion?configured=1");
}

async function trustedDeviceId(userId:string){const token=(await cookies()).get(DEVICE_COOKIE)?.value;if(!token)return null;const db=createSupabaseAdminClient();const {data}=await db.from("super_admin_devices").select("id").eq("user_id",userId).eq("device_token_digest",digestDeviceToken(token)).eq("status","approved").maybeSingle();return data?.id??null;}
export async function approveSuperAdminDevice(formData:FormData){const id=String(formData.get("deviceId")??"");const current=await getCurrentSuperAdmin();if(!current||!(await hasAal2(current.supabase))||!(await trustedDeviceId(current.user.id)))return;const db=createSupabaseAdminClient();const {data:target}=await db.from("super_admin_devices").select("id,device_name").eq("id",id).eq("user_id",current.user.id).eq("status","pending").maybeSingle();if(!target)return;await db.from("super_admin_devices").update({status:"approved",approved_at:new Date().toISOString()}).eq("id",target.id);await db.from("admin_actions").insert({admin_id:current.user.id,action:"super_admin_device_approved",target_type:"super_admin_device",target_id:target.id,reason:"Appareil approuvé depuis un appareil de confiance",metadata:{device_name:target.device_name}});revalidatePath("/admin/securite/appareils");}
export async function revokeSuperAdminDevice(formData:FormData){const id=String(formData.get("deviceId")??"");const current=await getCurrentSuperAdmin();if(!current||!(await hasAal2(current.supabase))||!(await trustedDeviceId(current.user.id)))return;const db=createSupabaseAdminClient();const {data:target}=await db.from("super_admin_devices").select("id,device_name,device_token_digest").eq("id",id).eq("user_id",current.user.id).eq("status","approved").maybeSingle();if(!target)return;const token=(await cookies()).get(DEVICE_COOKIE)?.value;if(token&&digestDeviceToken(token)===target.device_token_digest)return;await db.from("super_admin_devices").update({status:"revoked",revoked_at:new Date().toISOString()}).eq("id",target.id);await db.from("admin_actions").insert({admin_id:current.user.id,action:"super_admin_device_revoked",target_type:"super_admin_device",target_id:target.id,reason:"Appareil révoqué depuis un appareil de confiance",metadata:{device_name:target.device_name}});revalidatePath("/admin/securite/appareils");}
export async function signOutSuperAdminAction(){const supabase=await createSupabaseServerClient();const {data:{user}}=await supabase.auth.getUser();const wasSuperAdmin=user?await isSuperAdminUser(user.id):false;await supabase.auth.signOut();redirect(wasSuperAdmin?"/admin-connexion":"/connexion");}
