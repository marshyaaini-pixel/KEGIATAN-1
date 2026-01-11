
export interface ParticleState {
  red: number;
  blue: number;
}

export interface SimulationState {
  t0: ParticleState;
  t10: ParticleState;
  t20: ParticleState;
}

export interface StudentAnswers {
  reduction: string;
  formation: string;
  negative: string;
  air: string;
  definition: string;
}

export interface Submission {
  id: string;
  groupName: string;
  members: string;
  redInitial: number;
  answers: StudentAnswers;
  aiScore: number;
  aiFeedback: string;
  submittedAt: string;
}

export interface ParticlePosition {
  x: number;
  y: number;
  delay: string;
}
