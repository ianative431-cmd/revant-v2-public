import MessageThreadPage from "@/components/messages/MessageThreadPage";
export default function Page({ params, searchParams }: { params: Promise<{ conversationId: string }>; searchParams: Promise<{ status?: string }> }) { return <MessageThreadPage params={params} searchParams={searchParams} />; }
