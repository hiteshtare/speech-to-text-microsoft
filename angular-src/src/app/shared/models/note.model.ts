export class Note {
  _id: string;
  transcript: Value[];
  is_transcript_approve: boolean;
  entities: Entities;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export class Entities {
  products: Value[];
  keymessages: Value[];
  followups: Value[];
}

export class Value {
  before: string;
  after: string;
  is_approve: boolean;
  status: string;
}
