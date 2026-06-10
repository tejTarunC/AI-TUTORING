export interface TestMetadata {
  filename: string;
  topic: string;
  hardness: number;
  date: string;
  questionCount: number;
}

export interface Question {
  question: string;
  mutliple_choices: string[];
  answer: string;
}

export interface TestContent {
  topic: string;
  hardness: number;
  date: string;
  test: Question[];
}

export interface Attempt {
  date: string;
  score: number;
  total: number;
  timeTaken: number;
  answers: string[];
}

export interface History {
  testId: string;
  attempts: Attempt[];
}

export interface Note {
  notes: string;
}
