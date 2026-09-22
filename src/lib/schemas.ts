import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  email: z.string().email("올바른 이메일 형식이 아닙니다."),
  department_id: z.number().nullable(),
  position_id: z.number().nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "이름을 입력하세요."),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
