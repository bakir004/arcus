export type User = {
  id: string;
  email: string;
};

export type JobCreatedEvent = {
  jobId: string;
  workflowId: string;
};
