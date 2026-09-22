import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiError,
  createEmployee,
  fetchDepartments,
  fetchPositions,
  updateEmployee,
  type Employee,
} from "@/lib/api";
import { employeeSchema, type EmployeeFormValues } from "@/lib/schemas";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Employee | null;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  editing,
}: EmployeeDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      department_id: null,
      position_id: null,
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        email: editing?.email ?? "",
        department_id: editing?.department_id ?? null,
        position_id: editing?.position_id ?? null,
      });
    }
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: (values: EmployeeFormValues) => {
      const data = {
        name: values.name.trim(),
        email: values.email.trim(),
        department_id: values.department_id,
        position_id: values.position_id,
      };
      return editing ? updateEmployee(editing.id, data) : createEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success(editing ? "직원 정보를 수정했어요." : "직원을 등록했어요.");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "저장에 실패했어요. 다시 시도해 주세요."
      );
    },
  });

  const departmentId = form.watch("department_id");
  const positionId = form.watch("position_id");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "직원 수정" : "직원 등록"}</DialogTitle>
          <DialogDescription>
            이름과 이메일은 필수이며, 부서와 직무는 선택할 수 있어요.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutateAsync(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="employee-name">이름</Label>
            <Input
              id="employee-name"
              placeholder="예: 홍길동"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employee-email">이메일</Label>
            <Input
              id="employee-email"
              type="email"
              placeholder="example@company.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>부서</Label>
              <Select
                value={departmentId != null ? String(departmentId) : "none"}
                onValueChange={(value) =>
                  form.setValue(
                    "department_id",
                    value === "none" ? null : Number(value)
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>직무</Label>
              <Select
                value={positionId != null ? String(positionId) : "none"}
                onValueChange={(value) =>
                  form.setValue(
                    "position_id",
                    value === "none" ? null : Number(value)
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="직무 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">미지정</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={String(pos.id)}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
