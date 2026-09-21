import { CodingLanguage, type CodingLanguage as CodingLanguageType } from "@/features/exams/types"
import { siCplusplus, siJavascript, siOpenjdk, siPython, siSqlite } from "simple-icons"

export type SimpleIconData = {
    title: string
    path: string
    hex: string
}

export function SimpleIcon({ icon, className }: { icon: SimpleIconData; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className={className}>
            <path fill="currentColor" d={icon.path} />
        </svg>
    )
}

export const codingLanguageMeta: Record<
    CodingLanguageType,
    { label: string; icon: SimpleIconData; color: { light: string; dark: string } }
> = {
    [CodingLanguage.Cpp]: {
        label: "C++",
        icon: siCplusplus,
        color: { light: "#00599C", dark: "#7CB7E8" },
    },
    [CodingLanguage.Java]: {
        label: "Java",
        icon: siOpenjdk,
        color: { light: "#EA580C", dark: "#FB923C" },
    },
    [CodingLanguage.JavaScript]: {
        label: "JavaScript",
        icon: siJavascript,
        color: { light: "#B45309", dark: "#FACC15" },
    },
    [CodingLanguage.Python]: {
        label: "Python",
        icon: siPython,
        color: { light: "#2563EB", dark: "#60A5FA" },
    },
    [CodingLanguage.Sql]: {
        label: "SQL",
        icon: siSqlite,
        color: { light: "#16A34A", dark: "#4ADE80" },
    },
}
