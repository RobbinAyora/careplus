import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";

export const nurseStats = [
  {
    label: "Assigned Patients",
    value: "24",
    change: "+4 today",
    icon: Activity,
  },
  {
    label: "Today's Tasks",
    value: "18",
    change: "12 completed",
    icon: CheckCircle2,
  },
  {
    label: "Pending Vitals",
    value: "7",
    change: "Needs attention",
    icon: Clock3,
  },
  {
    label: "Appointments",
    value: "14",
    change: "Today",
    icon: CalendarDays,
  },
];

export const assignedPatients = [
  {
    name: "Grace Wanjiku",
    id: "PT-10482",
    room: "Room 204",
    condition: "Post-operative",
    status: "Stable",
    time: "08:30 AM",
  },
  {
    name: "David Otieno",
    id: "PT-10476",
    room: "Room 207",
    condition: "Hypertension",
    status: "Monitoring",
    time: "09:00 AM",
  },
  {
    name: "Mary Njeri",
    id: "PT-10465",
    room: "Room 211",
    condition: "Diabetes",
    status: "Stable",
    time: "09:30 AM",
  },
  {
    name: "Peter Kamau",
    id: "PT-10458",
    room: "Room 215",
    condition: "Respiratory",
    status: "Needs attention",
    time: "10:00 AM",
  },
];

export const vitals = [
  {
    patient: "Grace Wanjiku",
    room: "204",
    bloodPressure: "118/76",
    pulse: "74",
    temperature: "36.7°C",
    oxygen: "98%",
    status: "Normal",
  },
  {
    patient: "David Otieno",
    room: "207",
    bloodPressure: "142/91",
    pulse: "82",
    temperature: "36.8°C",
    oxygen: "97%",
    status: "Monitor",
  },
  {
    patient: "Mary Njeri",
    room: "211",
    bloodPressure: "124/80",
    pulse: "76",
    temperature: "36.6°C",
    oxygen: "99%",
    status: "Normal",
  },
];

export const nursingTasks = [
  {
    title: "Administer medication",
    patient: "Grace Wanjiku",
    time: "10:30 AM",
    priority: "High",
    completed: false,
  },
  {
    title: "Record patient vitals",
    patient: "David Otieno",
    time: "11:00 AM",
    priority: "Medium",
    completed: false,
  },
  {
    title: "Change wound dressing",
    patient: "Peter Kamau",
    time: "11:30 AM",
    priority: "High",
    completed: false,
  },
  {
    title: "Update nursing notes",
    patient: "Mary Njeri",
    time: "12:00 PM",
    priority: "Low",
    completed: true,
  },
];

export const recentNotes = [
  {
    patient: "Grace Wanjiku",
    note: "Patient recovering well after procedure. Pain level reduced.",
    time: "20 minutes ago",
  },
  {
    patient: "David Otieno",
    note: "Blood pressure remains slightly elevated. Continue monitoring.",
    time: "45 minutes ago",
  },
  {
    patient: "Mary Njeri",
    note: "Patient tolerated medication well with no adverse reaction.",
    time: "1 hour ago",
  },
];