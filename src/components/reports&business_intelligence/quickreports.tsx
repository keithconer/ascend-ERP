import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, FileDown } from "lucide-react";

const reports = [
  { name: "Sales Summary", type: "PDF", icon: FileText, color: "text-primary" },
  { name: "Inventory Stock", type: "Excel", icon: FileSpreadsheet, color: "text-accent" },
  { name: "Financial Report", type: "PDF", icon: FileText, color: "text-success" },
  { name: "HR Analytics", type: "CSV", icon: FileDown, color: "text-warning" },
];

export const QuickReports = () => {
  return (
    <Card className="p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-xl font-semibold text-foreground mb-4">Quick Reports</h2>
      <div className="space-y-3">
        {reports.map((report) => (
          <Button
            key={report.name}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <report.icon className={`h-5 w-5 ${report.color}`} />
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{report.name}</p>
              <p className="text-xs text-muted-foreground">{report.type} Format</p>
            </div>
            <FileDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        ))}
      </div>
      <Button className="w-full mt-4" variant="default">
        View All Reports
      </Button>
    </Card>
  );
};
