export type RegistrationValues = {
  name: string;
  quality_standards: string;
  production_time: number | string;
  warranty: number | string;
  production_cost: number | string;
};

export type Participant = RegistrationValues & { id: string; status: "accepted" | "approved" | "rejected" };
