
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  FlaskConical,
  Radio,
} from "lucide-react";
import type { DocumentRecord } from "@/lib/patients/patient-types";

interface Props {
  documents: DocumentRecord[];
}

export default function DocumentsList({
  documents,
}: Props) {
  function getIcon(type: DocumentRecord["type"]) {
    if (type === "Laboratory") return FlaskConical;
    if (type === "Radiology") return Radio;
    return FileText;
  }

  function getHref(type: DocumentRecord["type"]) {
    if (type === "Laboratory")
      return "/doctor/laboratory";

    if (type === "Radiology")
      return "/doctor/radiology";

    return "/doctor/medical-records";
  }

  return (
    <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
      <div>
        <h2 className="font-bold text-[#102a56]">
          Recent Documents
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Recent laboratory, radiology and clinical documents
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {documents.map((document) => {
          const Icon = getIcon(document.type);

          return (
            <Link
              key={document.id}
              href={getHref(document.type)}
              className="flex items-center gap-3 rounded-xl border border-blue-50 p-4 transition hover:bg-blue-50/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#102a56]">
                  {document.name}
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  {document.type} • {document.date}
                </p>

                {document.description && (
                  <p className="mt-1 text-xs text-slate-500">
                    {document.description}
                  </p>
                )}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

