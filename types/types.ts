export type RegistrationValues = {
  name: string;
  quality_standards: string;
  production_time: number | string;
  warranty: number | string;
  production_cost: number | string;
};

export type Participant = RegistrationValues & {
  id: string;
  status: "accepted" | "approved" | "rejected";
};

export type RequirementsItem = {
  title: string;
  unit: string;
  note: string;
  name: string;
  type: "string" | "number";
  required: boolean;
};

export type Auction<R = RequirementsItem> = {
  id: string;
  title: string;
  status: "idle" | "registration_participants" | "waiting_start" | "auction_underway" | "auction_over";
  supervisor: string;
  production_cost: number | string;
  requirements: R[];
  participants: Participant[];
  online: string[];
};
