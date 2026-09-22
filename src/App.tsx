import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CategoryManager } from "@/components/CategoryManager";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { EmployeeTable } from "@/components/EmployeeTable";
import {
  fetchDepartments,
  fetchEmployees,
  fetchPositions,
  type Employee,
} from "@/lib/api";

const PAGE_SIZE = 20;

function App() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [positionId, setPositionId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [departmentId, positionId]);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
  });

  const employeesQuery = useQuery({
    queryKey: [
      "employees",
      { search: debouncedSearch, departmentId, positionId, page },
    ],
    queryFn: () =>
      fetchEmployees({
        search: debouncedSearch || undefined,
        department_id: departmentId,
        position_id: positionId,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const data = employeesQuery.data;
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const hasAnyEmployees = total > 0 || (!debouncedSearch && !departmentId && !positionId);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setEditing(employee);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                직원 관리 시스템
              </h1>
              <p className="text-sm text-muted-foreground">
                부서·직무별 직원 정보를 관리하세요
              </p>
            </div>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            직원 등록
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">직원 목록</TabsTrigger>
            <TabsTrigger value="departments">부서 관리</TabsTrigger>
            <TabsTrigger value="positions">직무 관리</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 이메일로 검색"
                className="sm:max-w-xs"
              />
              <Select
                value={departmentId != null ? String(departmentId) : "all"}
                onValueChange={(value) =>
                  setDepartmentId(value === "all" ? null : Number(value))
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="부서 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 부서</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={positionId != null ? String(positionId) : "all"}
                onValueChange={(value) =>
                  setPositionId(value === "all" ? null : Number(value))
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="직무 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 직무</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={String(pos.id)}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || departmentId != null || positionId != null) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setDepartmentId(null);
                    setPositionId(null);
                  }}
                >
                  초기화
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                총 <span className="font-medium text-foreground">{total}</span>
                명의 직원
              </p>
              <p className="text-sm text-muted-foreground">
                {totalPages > 0 ? `${page} / ${totalPages} 페이지` : ""}
              </p>
            </div>

            <EmployeeTable
              data={data}
              isLoading={employeesQuery.isLoading}
              isError={employeesQuery.isError}
              hasAnyEmployees={hasAnyEmployees}
              onEdit={openEdit}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  이전
                </Button>
                <Badge variant="secondary">
                  {page} / {totalPages}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  다음
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <CategoryManager kind="department" />
          </TabsContent>

          <TabsContent value="positions" className="mt-6">
            <CategoryManager kind="position" />
          </TabsContent>
        </Tabs>
      </main>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />
    </div>
  );
}

export default App;
