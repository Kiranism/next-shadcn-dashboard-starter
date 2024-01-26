import { SendMessageForm } from "./form";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Send a message</h2>
        <SendMessageForm />
      </div>
    </ScrollArea>
  );
}
