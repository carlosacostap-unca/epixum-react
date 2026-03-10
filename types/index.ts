export interface BaseModel {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export type UserRole = 'admin' | 'docente' | 'estudiante';

export interface User extends BaseModel {
  username: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  dni?: string;
  birthDate?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
}

export interface Link extends BaseModel {
  title: string;
  url: string;
  class?: string; // Relation to Class ID (optional, mutually exclusive with assignment)
  assignment?: string; // Relation to Assignment ID (optional, mutually exclusive with class)
}

export interface Class extends BaseModel {
  title: string;
  description: string;
  sprint: string; // Relation to Sprint ID
  date: string;
  // Expanding relations
  expand?: {
    links?: Link[];
  };
}

export interface Sprint extends BaseModel {
  title: string;
  description: string;
  course: string; // Relation to Course ID (if multiple courses)
  startDate: string;
  endDate: string;
  // Expanding relations
  expand?: {
    classes?: Class[];
    assignments?: Assignment[];
  };
}

export interface Assignment extends BaseModel {
  title: string;
  description: string;
  sprint: string; // Relation to Sprint ID
  // Expanding relations
  expand?: {
    links?: Link[];
    deliveries?: Delivery[];
  };
}

export interface Delivery extends BaseModel {
  assignment: string;
  student: string;
  repositoryUrl: string;
  expand?: {
    student?: User;
  };
}

export interface Course extends BaseModel {
  title: string;
  description: string;
  // Expanding relations
  expand?: {
    sprints?: Sprint[];
  };
}

export interface Review extends BaseModel {
  sprint: string; // Relation to Sprint ID
  teacher: string; // Relation to User ID (teacher)
  student?: string; // Relation to User ID (student), optional (null if available)
  startTime: string; // ISO Date string
  endTime: string; // ISO Date string
  private_note?: string; // Note only for teachers
  public_note?: string;  // Feedback visible to the student
  meetingLink?: string; // Zoom/Meet link
  roomNumber?: string; // Physical or virtual room number
  status?: 'Aprobado' | 'Pendiente' | 'No presentó' | 'Desaprobado';
  expand?: {
    sprint?: Sprint;
    teacher?: User;
    student?: User;
  };
}

export interface Inquiry extends BaseModel {
  title: string;
  description: string;
  status: 'Pendiente' | 'Resuelta';
  author: string; // Relation to User ID
  class?: string; // Relation to Class ID (optional)
  assignment?: string; // Relation to Assignment ID (optional)
  expand?: {
    author?: User;
    class?: Class;
    assignment?: Assignment;
  };
}

export interface InquiryResponse extends BaseModel {
  inquiry: string; // Relation to Inquiry ID
  author: string; // Relation to User ID
  content: string;
  expand?: {
    author?: User;
  };
}
