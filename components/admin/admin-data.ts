import {
  CalendarDays,
  FileText,
  UsersRound,
} from "lucide-react";

export const adminStats = [
  {
    label: "Total Patients",
    value: "1,248",
    trend: "↑ 12%",
    comparison: "vs. last month",
    tone: "blue" as const,
    icon: UsersRound,
  },
  {
    label: "Today's Appointments",
    value: "86",
    trend: "↑ 8%",
    comparison: "vs. yesterday",
    tone: "green" as const,
    icon: CalendarDays,
  },
  {
    label: "Total Staff",
    value: "142",
    trend: "↑ 5%",
    comparison: "vs. last month",
    tone: "purple" as const,
    icon: UsersRound,
  },
  {
    label: "Pending Reports",
    value: "24",
    trend: "↑ 3%",
    comparison: "needs attention",
    tone: "red" as const,
    icon: FileText,
  },
];

export const departments = [
  ["General Medicine", "342", "Normal"],
  ["Pediatrics", "198", "Normal"],
  ["Surgery", "156", "High"],
  ["OB/GYN", "124", "Normal"],
  ["Orthopedics", "98", "Normal"],
  ["Cardiology", "76", "Moderate"],
];

export const admissions = [
  ["MW", "Mary Wanjiku", "34", "Female", "General Medicine", "16 Sep 2025 · 08:42 AM", "Admitted"],
  ["JO", "John Otieno", "52", "Male", "Surgery", "16 Sep 2025 · 07:21 AM", "Admitted"],
  ["AN", "Amina Hassan", "28", "Female", "Pediatrics", "15 Sep 2025 · 04:16 PM", "Discharged"],
  ["PK", "Peter Kamau", "45", "Male", "Orthopedics", "15 Sep 2025 · 02:03 PM", "Admitted"],
  ["LN", "Lucy Njeri", "60", "Female", "Cardiology", "15 Sep 2025 · 11:47 AM", "Admitted"],
];
