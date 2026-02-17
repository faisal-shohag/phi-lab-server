export interface TestCase {
    input?: string;
    expectedOutput?: string;
}

export interface ExecutionResult {
    result: [] | null;
    stdout: string[];
    
}

export interface Output {
    error: null | string;
    input: string
    output: string
    status: string
    stderr: string
    stdout: string[]
    yourOutput: any
    runtime: number
    memory: number,
    lineNumber?: number|null

}


/* --------------------------------------------------
   📋 Error Details Interface
-------------------------------------------------- */
export interface ErrorDetails {
  message: string;
  type: string;
  stack?: string;
  code?: string;
  lineNumber?: number;
  timestamp: string;
}