export const Role = { COLLABORATOR: "COLLABORATOR", MANAGER: "MANAGER", DIRECTOR: "DIRECTOR", DIRETOR_CENTRAL: "DIRETOR_CENTRAL", ADMIN: "ADMIN" } as const;
export type Role = typeof Role[keyof typeof Role];

export const ComplimentStatus = { PENDENTE_APROVACAO: "PENDENTE_APROVACAO", PENDENTE_AVALIACAO: "PENDENTE_AVALIACAO", REJEITADO: "REJEITADO", DEVOLVIDO_PARA_AJUSTE: "DEVOLVIDO_PARA_AJUSTE", AVALIADO: "AVALIADO" } as const;
export type ComplimentStatus = typeof ComplimentStatus[keyof typeof ComplimentStatus];

export const MedalType = { BRONZE: "BRONZE", SILVER: "SILVER", GOLD: "GOLD", SPECIAL: "SPECIAL" } as const;
export type MedalType = typeof MedalType[keyof typeof MedalType];

export const TrainingType = { TRAINING: "TRAINING", CONSULTANCY: "CONSULTANCY", COURSE: "COURSE" } as const;
export type TrainingType = typeof TrainingType[keyof typeof TrainingType];

export const NotificationType = { COMPLIMENT_APPROVED: "COMPLIMENT_APPROVED", COMPLIMENT_REJECTED: "COMPLIMENT_REJECTED", COMPLIMENT_RETURNED: "COMPLIMENT_RETURNED", COMPLIMENT_EVALUATED: "COMPLIMENT_EVALUATED", COMPLIMENT_REEVALUATED: "COMPLIMENT_REEVALUATED", NEW_PENDING_APPROVAL: "NEW_PENDING_APPROVAL", NEW_PENDING_EVALUATION: "NEW_PENDING_EVALUATION", DEADLINE_WARNING: "DEADLINE_WARNING", GENERAL: "GENERAL" } as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const AuditAction = { CREATE: "CREATE", UPDATE: "UPDATE", DELETE: "DELETE", APPROVE: "APPROVE", REJECT: "REJECT", RETURN_FOR_ADJUSTMENT: "RETURN_FOR_ADJUSTMENT", EVALUATE: "EVALUATE", REEVALUATE: "REEVALUATE", LOGIN: "LOGIN", LOGOUT: "LOGOUT", ACTIVATE_ACCOUNT: "ACTIVATE_ACCOUNT", DEACTIVATE_ACCOUNT: "DEACTIVATE_ACCOUNT", RESET_PASSWORD: "RESET_PASSWORD" } as const;
export type AuditAction = typeof AuditAction[keyof typeof AuditAction];

export const DeadlineType = { REGISTRATION: "REGISTRATION", APPROVAL: "APPROVAL", EVALUATION: "EVALUATION", CENTRAL_EVALUATION: "CENTRAL_EVALUATION" } as const;
export type DeadlineType = typeof DeadlineType[keyof typeof DeadlineType];

export const ApprovalAction = { APPROVED: "APPROVED", REJECTED: "REJECTED", RETURNED: "RETURNED" } as const;
export type ApprovalAction = typeof ApprovalAction[keyof typeof ApprovalAction];
