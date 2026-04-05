import ClubForm from "@/components/clubs/ClubForm";

export default function NewClubPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create a Club</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set up your pickleball club and start managing sessions.
        </p>
      </div>
      <ClubForm />
    </div>
  );
}
