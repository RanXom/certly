import { protectServer } from "@/features/auth/utils";
import { Banner } from "@/app/dashboard/banner";
import { ProjectsSection } from "@/app/dashboard/projects-section";

const Dashboard = async () => {
  await protectServer();

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto pb-10">
      <Banner />
      <ProjectsSection />
    </div>
  );
};

export default Dashboard;
