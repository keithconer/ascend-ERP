import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function ReportsAndMasters() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Projects",
      items: [
        { label: "Project", path: "/projects/projects" },
        { label: "Task", path: "/projects/tasks" },
        { label: "Project Template", path: "/projects/project-template" },
        { label: "Project Type", path: "/projects/project-type" },
        { label: "Project Update", path: "/projects/project-update" },
      ],
    },
    {
      title: "Time Tracking",
      items: [
        { label: "Time Sheet", path: "/projects/time-sheet" },
        { label: "Activity Type", path: "/projects/activity-type" },
        { label: "Activity Cost", path: "/projects/activity-cost" },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Daily Timesheet Summary", path: "/projects/daily-timesheet-summary" },
        { label: "Project Profitability", path: "/projects/project-profitability" },
        { label: "Project Wise Stock Tracking", path: "/projects/project-stock-tracking" },
        { label: "Project Billing Summary", path: "/projects/project-billing-summary" },
        { label: "Delayed Tasks Summary", path: "/projects/delayed-tasks-summary" },
      ],
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {sections.map((section, i) => (
        <Card key={i} className="hover:shadow-md transition">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {section.items.map((item, j) => (
                <li key={j}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="w-full text-left text-muted-foreground hover:text-primary hover:bg-muted px-3 py-2 rounded-md transition"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
