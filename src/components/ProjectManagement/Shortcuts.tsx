import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  FolderKanban,
  Clock,
  FileText,
  LayoutDashboard,
} from "lucide-react";

interface Shortcut {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

export default function Shortcuts() {
  const shortcuts: Shortcut[] = [
    { label: "Tasks", count: 8, icon: ClipboardList, color: "bg-blue-500" },
    { label: "Projects", count: 5, icon: FolderKanban, color: "bg-green-500" },
    { label: "Time Sheet", count: 12, icon: Clock, color: "bg-yellow-500" },
    { label: "Project Billing Summary", count: 3, icon: FileText, color: "bg-purple-500" },
    { label: "Dashboard", count: 1, icon: LayoutDashboard, color: "bg-orange-500" },
  ];

  // Calculate placeholders to make sure rows have consistent 3-column width
  const placeholdersCount = (3 - (shortcuts.length % 3)) % 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {shortcuts.map((shortcut, index) => (
        <Card
          key={index}
          className="transition hover:shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${shortcut.color} text-white`}>
                <shortcut.icon size={22} />
              </div>
              <span className="font-medium text-foreground text-lg">
                {shortcut.label}
              </span>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {shortcut.count}
            </Badge>
          </CardContent>
        </Card>
      ))}

      {/* Optional empty placeholders to preserve equal widths */}
      {Array.from({ length: placeholdersCount }).map((_, i) => (
        <div key={`placeholder-${i}`} className="invisible">
          <Card>
            <CardContent className="p-5"></CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
