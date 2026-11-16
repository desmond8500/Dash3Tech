/** Types renvoyés par l'API Dash3 (/api/v1/tech/*). */

export interface Ref {
  id: number;
  name: string;
}

export interface TechUser {
  id: number;
  firstname: string;
  lastname: string | null;
  email: string;
  function: string | null;
  avatar: string | null;
}

export interface Status {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  name: string;
  description: string | null;
  statut_id: number | null;
  statut: string | null;
  priority_id: number | null;
  priority: string | null;
  start_date: string | null;
  end_date: string | null;
  expiration_date: string | null;
  client: Ref | null;
  projet: Ref | null;
  building: Ref | null;
  stage: Ref | null;
  room: Ref | null;
  subtasks: { id: number; name: string; status_id: number | null }[];
  updated_at: string | null;
}

export interface Article {
  id: number;
  designation: string;
  reference: string | null;
  description: string | null;
  spec: string | null;
  brand: string | null;
  image: string | null;
}

export type ShareCategory = 'info' | 'materiel' | 'acces' | 'document';

export interface Share {
  id: number;
  category: ShareCategory;
  title: string;
  content: string | null;
  task_id: number | null;
  projet: Ref | null;
  building: Ref | null;
  article: Article | null;
  has_file: boolean;
  file_name: string | null;
  expires_at: string | null;
  expires_with_task: boolean;
  read_at: string | null;
  author: string | null;
  created_at: string | null;
}

export type ReportStatus = 'submitted' | 'validated' | 'rejected';

export interface Report {
  id: number | null; // null tant que le rapport n'est pas envoyé
  client_uuid: string;
  task_id: number | null;
  task: string | null;
  projet_id: number | null;
  title: string;
  content: string | null;
  status: ReportStatus | 'pending';
  latitude: number | null;
  longitude: number | null;
  reported_at: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  photos: { id: number | null; client_uuid: string | null; caption: string | null }[];
  author: string | null;
  created_at: string | null;
}

export type AccessStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequest {
  id: number | null;
  client_uuid: string;
  subject: string;
  reason: string | null;
  task_id: number | null;
  projet_id: number | null;
  article_id: number | null;
  status: AccessStatus | 'queued';
  response: string | null;
  decided_at: string | null;
  tech_share_id: number | null;
  requester: string | null;
  created_at: string | null;
}

export interface Snapshot {
  server_time: string;
  user: TechUser;
  statuses: Status[];
  tasks: Task[];
  shares: Share[];
  reports: Report[];
  access_requests: AccessRequest[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: unknown;
}
