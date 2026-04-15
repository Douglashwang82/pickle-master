import ClubForm from "@/components/clubs/ClubForm";

export default function NewClubPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">創建社團</h1>
        <p className="text-muted-foreground text-sm mt-1">
          建立您的匹克球社團，開始管理場次。
        </p>
      </div>
      <ClubForm />
    </div>
  );
}
