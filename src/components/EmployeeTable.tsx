import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ApiError,
  deleteEmployee,
  type Employee,
  type EmployeePage,
} from "@/lib/api";

interface EmployeeTableProps {
  data: EmployeePage | undefined;
  isLoading: boolean;
  isError: boolean;
  hasAnyEmployees: boolean;
  onEdit: (employee: Employee) => void;
}

export function EmployeeTable({
  data,
  isLoading,
  isError,
  hasAnyEmployees,
  onEdit,
}: EmployeeTableProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("직원을 삭제했어요.");
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "삭제에 실패했어요. 다시 시도해 주세요."
      );
      setDeleting(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <p className="font-medium text-foreground">
          직원 목록을 불러오지 못했어요
        </p>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요.
        </p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <UserRound className="size-12 text-muted-foreground" />
        {hasAnyEmployees ? (
          <>
            <p className="font-medium text-foreground">
              검색·필터 결과가 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              검색어나 필터 조건을 변경해 보세요.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-foreground">
              등록된 직원이 없습니다
            </p>
            <p className="text-sm text-muted-foreground">
              직원 등록 버튼을 눌러 첫 직원을 추가해 보세요.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead className="hidden md:table-cell">이메일</TableHead>
              <TableHead>부서</TableHead>
              <TableHead>직무</TableHead>
              <TableHead className="w-24 text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {emp.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{emp.name}</p>
                      <p className="truncate text-xs text-muted-foreground md:hidden">
                        {emp.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {emp.email}
                </TableCell>
                <TableCell>
                  {emp.department_name ? (
                    <Badge variant="outline">{emp.department_name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {emp.position_name ? (
                    <Badge variant="secondary">{emp.position_name}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(emp)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteMutation.isPending}
                      onClick={() => setDeleting(emp)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>직원 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>{" "}
              직원 정보를 삭제할까요? 이 작업은 되돌릴 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutateAsync(deleting.id)}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
