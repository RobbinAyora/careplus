
import type {
  Appointment,
  DocumentRecord,
  Medication,
  Patient,
  PatientSummary,
  VisitRecord,
  Vitals,
} from "./patient-types";

const doctors = {
  james: "Dr. James Mwangi",
  grace: "Dr. Grace Wambui",
  daniel: "Dr. Daniel Otieno",
};

export const mockPatients: Patient[] = [
  {
    id: "P-00123",
    name: "Grace Wanjiku",
    age: 28,
    gender: "Female",
    phone: "+254 712 345 678",
    email: "gracew@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-09-16",
    nextAppointment: "2025-09-25T09:30:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-90812345",
    allergies: ["Penicillin"],
    chronicConditions: ["Asthma"],
    flagged: true,
  },

  {
    id: "P-00124",
    name: "David Otieno",
    age: 45,
    gender: "Male",
    phone: "+254 723 456 789",
    email: "david.otieno@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-09-12",
    nextAppointment: "2025-09-23T10:00:00",
    insuranceProvider: "Jubilee Health",
    insuranceNumber: "JUB-441278",
    allergies: [],
    chronicConditions: ["Hypertension"],
    flagged: true,
  },

  {
    id: "P-00125",
    name: "Amina Yusuf",
    age: 32,
    gender: "Female",
    phone: "+254 701 567 890",
    email: "amina.yusuf@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-09-08",
    nextAppointment: "2025-09-29T11:00:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-78234121",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00126",
    name: "Peter Kamau",
    age: 41,
    gender: "Male",
    phone: "+254 733 678 901",
    email: "peter.kamau@gmail.com",
    status: "Admitted",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    ward: "Medical Ward A",
    bed: "A-14",
    lastVisit: "2025-09-17",
    insuranceProvider: "Britam",
    insuranceNumber: "BR-773821",
    allergies: [],
    chronicConditions: ["Diabetes"],
    flagged: true,
  },

  {
    id: "P-00127",
    name: "Faith Njeri",
    age: 36,
    gender: "Female",
    phone: "+254 722 789 012",
    email: "faith.njeri@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-08-28",
    nextAppointment: "2025-09-26T15:30:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-67219832",
    allergies: ["Sulfa drugs"],
    chronicConditions: [],
    flagged: true,
  },

  {
    id: "P-00128",
    name: "Michael Kimani",
    age: 52,
    gender: "Male",
    phone: "+254 710 234 567",
    email: "michael.kimani@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-08-21",
    nextAppointment: "2025-09-30T08:30:00",
    insuranceProvider: "AAR",
    insuranceNumber: "AAR-338821",
    allergies: [],
    chronicConditions: ["Hypertension"],
    flagged: true,
  },

  {
    id: "P-00129",
    name: "Caroline Achieng",
    age: 29,
    gender: "Female",
    phone: "+254 731 890 123",
    email: "caroline.achieng@gmail.com",
    status: "Discharged",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-08-15",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-551902",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00130",
    name: "James Ochieng",
    age: 60,
    gender: "Male",
    phone: "+254 780 123 456",
    email: "james.ochieng@gmail.com",
    status: "Outpatient",
    assignedDoctorId: "DOC-002",
    assignedDoctorName: doctors.grace,
    lastVisit: "2025-08-10",
    nextAppointment: "2025-09-27T14:00:00",
    insuranceProvider: "Madison",
    insuranceNumber: "MAD-228193",
    allergies: [],
    chronicConditions: ["COPD"],
    flagged: true,
  },

  {
    id: "P-00131",
    name: "Mary Wambui",
    age: 24,
    gender: "Female",
    phone: "+254 714 552 981",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-08-06",
    nextAppointment: "2025-09-22T09:00:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-112893",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00132",
    name: "Samuel Kariuki",
    age: 67,
    gender: "Male",
    phone: "+254 722 341 789",
    status: "Admitted",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    ward: "Medical Ward B",
    bed: "B-07",
    lastVisit: "2025-09-17",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-883120",
    allergies: ["Aspirin"],
    chronicConditions: ["Hypertension", "Diabetes"],
    flagged: true,
  },

  {
    id: "P-00133",
    name: "Lucy Atieno",
    age: 39,
    gender: "Female",
    phone: "+254 701 442 903",
    status: "Discharged",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-07-19",
    insuranceProvider: "Jubilee Health",
    insuranceNumber: "JUB-98231",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00134",
    name: "Brian Mwangi",
    age: 34,
    gender: "Male",
    phone: "+254 712 903 221",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-07-14",
    nextAppointment: "2025-09-24T13:30:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-773812",
    allergies: [],
    chronicConditions: ["Asthma"],
    flagged: true,
  },

  {
    id: "P-00135",
    name: "Janet Moraa",
    age: 48,
    gender: "Female",
    phone: "+254 723 118 402",
    status: "Outpatient",
    assignedDoctorId: "DOC-003",
    assignedDoctorName: doctors.daniel,
    lastVisit: "2025-07-05",
    insuranceProvider: "AAR",
    insuranceNumber: "AAR-119823",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00136",
    name: "Joseph Maina",
    age: 57,
    gender: "Male",
    phone: "+254 735 889 122",
    status: "Admitted",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    ward: "Surgical Ward",
    bed: "S-11",
    lastVisit: "2025-09-17",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-918223",
    allergies: [],
    chronicConditions: ["Diabetes"],
    flagged: true,
  },

  {
    id: "P-00137",
    name: "Esther Nyambura",
    age: 31,
    gender: "Female",
    phone: "+254 711 290 881",
    status: "Outpatient",
    assignedDoctorId: "DOC-001",
    assignedDoctorName: doctors.james,
    lastVisit: "2025-06-22",
    nextAppointment: "2025-09-28T10:30:00",
    insuranceProvider: "SHA",
    insuranceNumber: "SHA-441291",
    allergies: [],
    chronicConditions: [],
  },

  {
    id: "P-00138",
    name: "Robert Ouma",
    age: 43,
    gender: "Male",
    phone: "+254 722 891 002",
    status: "Discharged",
    assignedDoctorId: "DOC-002",
    assignedDoctorName: doctors.grace,
    lastVisit: "2025-06-11",
    insuranceProvider: "Britam",
    insuranceNumber: "BR-992381",
    allergies: ["Penicillin"],
    chronicConditions: [],
    flagged: true,
  },
];

/* =========================================================
   PATIENT SUMMARIES
========================================================= */

const defaultVitals: Vitals = {
  recordedAt: "2025-09-16T09:30:00",
  bloodPressure: "120/80 mmHg",
  temperature: 36.7,
  weight: 68,
  pulse: 76,
};

const defaultVisits: VisitRecord[] = [
  {
    id: "VIS-001",
    date: "2025-09-16",
    doctorName: doctors.james,
    reason: "General Checkup",
    diagnosis: "Stable condition",
    notes: "Patient reviewed during routine consultation.",
  },
  {
    id: "VIS-002",
    date: "2025-08-12",
    doctorName: doctors.james,
    reason: "Follow-up",
    diagnosis: "Ongoing management",
    notes: "Previous treatment reviewed.",
  },
  {
    id: "VIS-003",
    date: "2025-06-05",
    doctorName: doctors.james,
    reason: "Routine Consultation",
    diagnosis: "No acute concerns",
    notes: "Routine clinical review.",
  },
];

export const patientSummaries: Record<string, PatientSummary> = {};

mockPatients.forEach((patient) => {
  patientSummaries[patient.id] = {
    patient,

    latestVitals: {
      ...defaultVitals,
      recordedAt: patient.lastVisit
        ? `${patient.lastVisit}T09:30:00`
        : defaultVitals.recordedAt,
    },

    currentMedications:
      patient.chronicConditions.length > 0
        ? [
            {
              id: `MED-${patient.id}-1`,
              name:
                patient.chronicConditions[0] === "Hypertension"
                  ? "Amlodipine"
                  : patient.chronicConditions[0] === "Diabetes"
                    ? "Metformin"
                    : "Salbutamol Inhaler",
              dosage:
                patient.chronicConditions[0] === "Diabetes"
                  ? "500 mg"
                  : "10 mg",
              frequency: "Once daily",
              status: "Active",
            },
          ]
        : [],

    visitHistory: defaultVisits.map((visit, index) => ({
      ...visit,
      id: `${visit.id}-${patient.id}-${index}`,
    })),

    upcomingAppointments: patient.nextAppointment
      ? [
          {
            id: `APT-${patient.id}`,
            date: patient.nextAppointment.split("T")[0],
            time:
              patient.nextAppointment.split("T")[1]?.slice(0, 5) || "09:00",
            doctorName: patient.assignedDoctorName,
            reason: "Follow-up consultation",
            status: "Upcoming",
          },
        ]
      : [],

    recentDocuments: [
      {
        id: `DOC-${patient.id}-1`,
        date: patient.lastVisit || "2025-08-20",
        name: "Laboratory Results",
        type: "Laboratory",
        description: "Recent blood work report",
      },
      {
        id: `DOC-${patient.id}-2`,
        date: "2025-08-12",
        name: "Clinical Consultation Note",
        type: "Medical Record",
        description: "Latest clinical consultation",
      },
    ],
  };
});

export function getPatientById(id: string) {
  return mockPatients.find((patient) => patient.id === id);
}

export function getPatientSummary(id: string) {
  return patientSummaries[id];
}

