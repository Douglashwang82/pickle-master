"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, CheckCircle2, Clock } from "lucide-react";

type ClubPreview = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  membership_type: string;
  member_count: number;
};

type Props = {
  token: string;
  club: ClubPreview;
  isAuthenticated: boolean;
  alreadyMember: boolean;
  pendingApplication: boolean;
};

export default function InvitePage({
  token,
  club,
  isAuthenticated,
  alreadyMember,
  pendingApplication,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"joined" | "applied" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = club.membership_type === "open";

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/join`, { method: "POST" });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        setError(err.error ?? "Something went wrong");
        return;
      }
      const typed = data as { type: string };
      setResult(typed.type === "joined" ? "joined" : "applied");
    } finally {
      setLoading(false);
    }
  }

  const loginUrl = `/login?next=/invite/${token}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <Link href="/" className="text-2xl font-black tracking-tighter text-primary">
            PickleMaster
          </Link>
          <p className="text-sm text-muted-foreground">You&apos;ve been invited to join a club</p>
        </div>

        {/* Club Card */}
        <Card className="overflow-hidden">
          {club.cover_image_url && (
            <div className="relative h-40 w-full">
              <Image
                src={club.cover_image_url}
                alt={club.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-xl font-bold">{club.name}</h1>
              <Badge variant={isOpen ? "default" : "secondary"}>
                {isOpen ? "Open Join" : "Application Required"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{club.member_count} members</span>
            </div>
          </CardHeader>
          {club.description && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground line-clamp-3">{club.description}</p>
            </CardContent>
          )}
        </Card>

        {/* Action Area */}
        {result === "joined" ? (
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve joined <strong>{club.name}</strong>! Welcome aboard.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => router.push(`/clubs/${club.slug}`)}>
              Go to Club
            </Button>
          </div>
        ) : result === "applied" ? (
          <div className="space-y-3">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your application to <strong>{club.name}</strong> has been submitted. The club leader
                will review it shortly.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => router.push("/clubs")}>
              Browse Other Clubs
            </Button>
          </div>
        ) : alreadyMember ? (
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>You&apos;re already a member of this club.</AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => router.push(`/clubs/${club.slug}`)}>
              Go to Club
            </Button>
          </div>
        ) : pendingApplication ? (
          <div className="space-y-3">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your application is already pending review.
              </AlertDescription>
            </Alert>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/clubs/${club.slug}`)}>
              View Club
            </Button>
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" onClick={handleJoin} disabled={loading}>
              {loading
                ? "Processing…"
                : isOpen
                ? `Join ${club.name}`
                : `Apply to Join ${club.name}`}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Sign in or create an account to join this club.
            </p>
            <Button className="w-full" asChild>
              <Link href={loginUrl}>Sign In / Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
