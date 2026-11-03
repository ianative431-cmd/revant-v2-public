"use client";
import { useEffect } from "react";
export default function AdminPwaRegister(){useEffect(()=>{if(!("serviceWorker" in navigator))return;let disposed=false;void navigator.serviceWorker.register("/admin/sw.js",{scope:"/admin/",updateViaCache:"none"}).then(r=>{if(!disposed)return r.update();}).catch(()=>undefined);return()=>{disposed=true;};},[]);return null;}
