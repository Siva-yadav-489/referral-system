// import { SiteHeader } from "@/components/site-header";
import { OccupancyView } from "@/components/occupancy-view";

export default function OccupancyPage() {
  return (
    <>
      {/* <SiteHeader title="Occupancy" /> */}
      <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
        <OccupancyView />
      </div>
    </>
  );
}
