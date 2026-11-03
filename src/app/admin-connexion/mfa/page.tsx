import MfaForm from "./MfaForm";
export default async function SuperAdminMfaPage({searchParams}:{searchParams:Promise<{next?:string}>}){const p=await searchParams;return <MfaForm nextStep={p.next==="setup"?"setup":"admin"}/>}
