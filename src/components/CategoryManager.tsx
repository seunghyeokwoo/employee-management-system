import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
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
import {
  ApiError,
  createDepartment,
  createPosition,
  deleteDepartment,
  deletePosition,
  fetchDepartments,
  fetchPositions,
  updateDepartment,
  updatePosition,
  type Department,
  type Position,
} from "@/lib/api";
import { categorySchema, type CategoryFormValues } from "@/lib/schemas";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Department | Position | null;
  kind: "department" | "position";
}

function CategoryDialog({
  open,
  onOpenChange,
  editing,
  kind,
}: CategoryDialogProps) {
  const queryClient = useQueryClient();
  const label = kind === "department" ? "부서" : "직무";
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
      });
    }
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const data = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
      };
      if (editing) {
        return kind === "department"
          ? updateDepartment(editing.id, data)
          : updatePosition(editing.id, data);
      }
      return kind === "department"
        ? createDepartment(data)
        : createPosition(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(editing ? `${label}을 수정했어요.` : `${label}을 추가했어요.`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : `${label} 저장에 실패했어요. 다시 시도해 주세요.`
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? `${label} 수정` : `${label} 추가`}
          </DialogTitle>
          <DialogDescription>
            {label} 이름과 설명을 입력해 주세요.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutateAsync(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="category-name">이름</Label>
            <Input
              id="category-name"
              placeholder={`${label} 이름`}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">설명 (선택)</Label>
            <Textarea
              id="category-description"
              placeholder={`${label}에 대한 간단한 설명`}
              rows={3}
              {...form.register("description")}
            />
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

interface CategoryManagerProps {
  kind: "department" | "position";
}

export function CategoryManager({ kind }: CategoryManagerProps) {
  const queryClient = useQueryClient();
  const label = kind === "department" ? "부서" : "직무";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | Position | null>(null);
  const [deleting, setDeleting] = useState<Department | Position | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [kind === "department" ? "departments" : "positions"],
    queryFn: kind === "department" ? fetchDepartments : fetchPositions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      kind === "department" ? deleteDepartment(id) : deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(`${label}을 삭제했어요.`);
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? error.message
          : `${label} 삭제에 실패했어요. 다시 시도해 주세요.`
      );
      setDeleting(null);
    },
  });

  const items = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          전체 {items.length}개의 {label}
        </p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          {label} 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center">
          <p className="font-medium text-foreground">
            등록된 {label}이 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            {label}을 추가하면 직원 등록 시 선택할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead className="hidden md:table-cell">설명</TableHead>
                <TableHead className="text-right">직원 수</TableHead>
                <TableHead className="w-24 text-right">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{item.employee_count}명</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(item);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deleteMutation.isPending}
                        onClick={() => setDeleting(item)}
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
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        kind={kind}
      />

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{label} 삭제</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">
                {deleting?.name}
              </span>{" "}
              {label}을 삭제할까요? 소속 직원이 있으면 삭제할 수 없어요.
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
    </div>
  );
}
