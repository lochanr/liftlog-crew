import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function NotInvitedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="bg-zinc-900 border-zinc-800 max-w-sm">
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Private Crew Only</h2>
          <p className="text-zinc-500 text-sm">
            This app is invite-only. Ask the crew admin to add you to the squad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
