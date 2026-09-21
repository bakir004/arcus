import type { Exam, ExamQuestion, QuestionAnswerPayload } from "@/features/exams/types"
import type { TestCase } from "../components/coding/exam-coding"

const DB_NAME = "arcus-exam-offline"
const DB_VERSION = 1

const EXAMS_STORE = "exams"
const QUESTIONS_STORE = "questions"
const ATTEMPTS_STORE = "attempts"
const QUESTIONS_BY_EXAM_INDEX = "by_exam_id"

export interface PersistedAttemptState {
    examId: string
    attemptId: string
    studentId: string
    answersByQuestion: Record<string, QuestionAnswerPayload>
    pendingSyncByQuestion: Record<string, QuestionAnswerPayload>
    flagged: Record<string, boolean>
    testResults: Record<string, TestCase[]>
    updatedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof indexedDB !== "undefined"
}

function openDatabase(): Promise<IDBDatabase> {
    if (!isBrowser()) {
        return Promise.reject(new Error("IndexedDB is only available in the browser"))
    }

    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = () => {
            const db = request.result

            if (!db.objectStoreNames.contains(EXAMS_STORE)) {
                db.createObjectStore(EXAMS_STORE, { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains(QUESTIONS_STORE)) {
                const questions = db.createObjectStore(QUESTIONS_STORE, {
                    keyPath: "id",
                })
                questions.createIndex(QUESTIONS_BY_EXAM_INDEX, "examId", {
                    unique: false,
                })
            }

            if (!db.objectStoreNames.contains(ATTEMPTS_STORE)) {
                db.createObjectStore(ATTEMPTS_STORE, { keyPath: "examId" })
            }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"))
    })

    return dbPromise
}

function txDone(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"))
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"))
    })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"))
    })
}

export async function cacheExam(exam: Exam): Promise<void> {
    if (!isBrowser()) return
    const db = await openDatabase()
    const tx = db.transaction(EXAMS_STORE, "readwrite")
    tx.objectStore(EXAMS_STORE).put(exam)
    await txDone(tx)
}

export async function getCachedExam(examId: string): Promise<Exam | null> {
    if (!isBrowser()) return null
    const db = await openDatabase()
    const tx = db.transaction(EXAMS_STORE, "readonly")
    const result = await requestToPromise(tx.objectStore(EXAMS_STORE).get(examId))
    await txDone(tx)
    return (result as Exam | undefined) ?? null
}

export async function cacheExamQuestions(questions: ExamQuestion[]): Promise<void> {
    if (!isBrowser()) return
    if (questions.length === 0) return
    const db = await openDatabase()
    const tx = db.transaction(QUESTIONS_STORE, "readwrite")
    const store = tx.objectStore(QUESTIONS_STORE)
    for (const question of questions) {
        store.put(question)
    }
    await txDone(tx)
}

export async function getCachedExamQuestions(examId: string): Promise<ExamQuestion[]> {
    if (!isBrowser()) return []
    const db = await openDatabase()
    const tx = db.transaction(QUESTIONS_STORE, "readonly")
    const index = tx.objectStore(QUESTIONS_STORE).index(QUESTIONS_BY_EXAM_INDEX)
    const result = await requestToPromise(index.getAll(examId))
    await txDone(tx)

    const questions = (result as ExamQuestion[] | undefined) ?? []
    return questions.sort((a, b) => a.position - b.position)
}

export async function saveAttemptState(state: PersistedAttemptState): Promise<void> {
    if (!isBrowser()) return
    const db = await openDatabase()
    const tx = db.transaction(ATTEMPTS_STORE, "readwrite")
    tx.objectStore(ATTEMPTS_STORE).put(state)
    await txDone(tx)
}

export async function getAttemptState(examId: string): Promise<PersistedAttemptState | null> {
    if (!isBrowser()) return null
    const db = await openDatabase()
    const tx = db.transaction(ATTEMPTS_STORE, "readonly")
    const result = await requestToPromise(tx.objectStore(ATTEMPTS_STORE).get(examId))
    await txDone(tx)
    return (result as PersistedAttemptState | undefined) ?? null
}

export async function clearAttemptState(examId: string): Promise<void> {
    if (!isBrowser()) return
    const db = await openDatabase()
    const tx = db.transaction(ATTEMPTS_STORE, "readwrite")
    tx.objectStore(ATTEMPTS_STORE).delete(examId)
    await txDone(tx)
}
