import { protectServer } from "@/features/auth/utils";
import { Banner } from "@/app/dashboard/banner";

const Dashboard = async () => {
  await protectServer();

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto pb-10">
      <Banner />
    </div>
  );
};

export default Dashboard;
