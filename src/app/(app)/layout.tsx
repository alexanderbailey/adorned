import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* pb accounts for: 60px nav + home indicator + FAB clearance */}
      <main className="min-h-screen pb-[140px]">{children}</main>
      <BottomTabBar />
    </>
  );
}
