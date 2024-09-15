// Packages:
import { useState, useEffect } from "react";
import { cn } from "../lib/utils";

// Components:
import { Separator } from "../components/ui/separator";
import FormProfile from "../components/tertiary/FormProfile";
import FormAccount from "../components/tertiary/FormAccount";

// Functions:
const Settings = () => {
  //State:
  const [selectedTab, setselectedTab] = useState(0);

  // Constants:
  const sidebarNavItems = [
    {
      title: "Profile",
      subtext: "Manage your safety on the internet.",
      points: "Intelligent Warning • Safety Banner Position",
    },
    {
      title: "Account",
      subtext: "Manage your moderation preferences.",
      points: "Check Comments • Unsafe Content Policy",
    },
    {
      title: "Appearance",
      subtext: "Control the look and feel of OpenReply.",
      points: "Theme • Visibility",
    },
  ];

  // Return:
  return (
    <main
      className="w-full pt-16 bg-white"
      style={{ height: "calc(100% - 68px)" }}
    >
      <div className="h-full w-full flex flex-row">
        <nav className="w-1/3 h-full flex flex-col pt-5 px-2 gap-4">
          {sidebarNavItems.map((item, index) => (
            <div
              className={cn(
                "data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:bg-overlay transition-all",
                "w-full p-3 flex flex-col gap-1 justify-start cursor-pointer bg-[#ffffff] hover:bg-overlay transition-colors duration-200 rounded-lg"
              )}
              onClick={() => {
                setselectedTab(index);
              }}
              data-state={selectedTab === index ? "active" : "inactive"}
            >
              <span className="font-semibold text-sm">{item.title}</span>
              <span className="text-xs font-normal text-brand-secondary">
                {item.subtext}
              </span>
              <span className="text-[0.5625rem] font-light text-brand-tertiary">
                {item.points}
              </span>
            </div>
          ))}
        </nav>
        <Separator orientation="vertical" />
        <div className="w-2/3 flex flex-col pt-7 px-4 gap-6">
          {selectedTab === 0 && <FormProfile />}
          {selectedTab === 1 && <FormAccount />}
        </div>
      </div>
    </main>
  );
};

// Exports:
export default Settings;
