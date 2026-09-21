export interface CodingExample {
    input: string
    output: string
    explanation?: string
}

export interface TestCase {
    id: string
    label: string
    input: string
    expected: string
    assembledCode?: string
    serverCode?: string
    testCode?: string
    actual?: string
    status?: "passed" | "failed" | "pending"
}
