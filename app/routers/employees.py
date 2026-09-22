from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Department, Employee, Position
from app.schemas import (
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    EmployeeCreate,
    EmployeeOut,
    EmployeePage,
    EmployeeUpdate,
    PositionCreate,
    PositionOut,
    PositionUpdate,
)


# ---------------------------------------------------------------- departments
router = APIRouter()


@router.get("/departments", response_model=list[DepartmentOut])
async def list_departments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().unique().all()
    counts = await db.execute(
        select(Employee.department_id, func.count(Employee.id))
        .group_by(Employee.department_id)
    )
    count_map = {dept_id: cnt for dept_id, cnt in counts.all()}
    return [
        DepartmentOut(
            id=d.id,
            name=d.name,
            description=d.description,
            employee_count=count_map.get(d.id, 0),
        )
        for d in departments
    ]


@router.post("/departments", response_model=DepartmentOut, status_code=201)
async def create_department(
    payload: DepartmentCreate, db: AsyncSession = Depends(get_db)
):
    dept = Department(name=payload.name, description=payload.description)
    db.add(dept)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 부서 이름입니다.")
    await db.refresh(dept)
    return DepartmentOut(
        id=dept.id, name=dept.name, description=dept.description, employee_count=0
    )


@router.put("/departments/{dept_id}", response_model=DepartmentOut)
async def update_department(
    dept_id: int, payload: DepartmentUpdate, db: AsyncSession = Depends(get_db)
):
    dept = await db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    if payload.name is not None:
        dept.name = payload.name
    if payload.description is not None:
        dept.description = payload.description
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 부서 이름입니다.")
    await db.refresh(dept)
    count = await db.scalar(
        select(func.count(Employee.id)).where(Employee.department_id == dept.id)
    )
    return DepartmentOut(
        id=dept.id,
        name=dept.name,
        description=dept.description,
        employee_count=count or 0,
    )


@router.delete("/departments/{dept_id}", status_code=204)
async def delete_department(dept_id: int, db: AsyncSession = Depends(get_db)):
    dept = await db.get(Department, dept_id)
    if dept is None:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다.")
    count = await db.scalar(
        select(func.count(Employee.id)).where(Employee.department_id == dept_id)
    )
    if count:
        raise HTTPException(
            status_code=409,
            detail=f"이 부서에 소속된 직원이 {count}명 있어 삭제할 수 없습니다.",
        )
    await db.delete(dept)
    await db.commit()


# ------------------------------------------------------------------ positions
positions_router = APIRouter()


@positions_router.get("/positions", response_model=list[PositionOut])
async def list_positions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).order_by(Position.name))
    positions = result.scalars().unique().all()
    counts = await db.execute(
        select(Employee.position_id, func.count(Employee.id)).group_by(
            Employee.position_id
        )
    )
    count_map = {pos_id: cnt for pos_id, cnt in counts.all()}
    return [
        PositionOut(
            id=p.id,
            name=p.name,
            description=p.description,
            employee_count=count_map.get(p.id, 0),
        )
        for p in positions
    ]


@positions_router.post("/positions", response_model=PositionOut, status_code=201)
async def create_position(
    payload: PositionCreate, db: AsyncSession = Depends(get_db)
):
    pos = Position(name=payload.name, description=payload.description)
    db.add(pos)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 직무 이름입니다.")
    await db.refresh(pos)
    return PositionOut(
        id=pos.id, name=pos.name, description=pos.description, employee_count=0
    )


@positions_router.put("/positions/{pos_id}", response_model=PositionOut)
async def update_position(
    pos_id: int, payload: PositionUpdate, db: AsyncSession = Depends(get_db)
):
    pos = await db.get(Position, pos_id)
    if pos is None:
        raise HTTPException(status_code=404, detail="직무를 찾을 수 없습니다.")
    if payload.name is not None:
        pos.name = payload.name
    if payload.description is not None:
        pos.description = payload.description
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 존재하는 직무 이름입니다.")
    await db.refresh(pos)
    count = await db.scalar(
        select(func.count(Employee.id)).where(Employee.position_id == pos.id)
    )
    return PositionOut(
        id=pos.id,
        name=pos.name,
        description=pos.description,
        employee_count=count or 0,
    )


@positions_router.delete("/positions/{pos_id}", status_code=204)
async def delete_position(pos_id: int, db: AsyncSession = Depends(get_db)):
    pos = await db.get(Position, pos_id)
    if pos is None:
        raise HTTPException(status_code=404, detail="직무를 찾을 수 없습니다.")
    count = await db.scalar(
        select(func.count(Employee.id)).where(Employee.position_id == pos_id)
    )
    if count:
        raise HTTPException(
            status_code=409,
            detail=f"이 직무에 소속된 직원이 {count}명 있어 삭제할 수 없습니다.",
        )
    await db.delete(pos)
    await db.commit()


# ------------------------------------------------------------------ employees
employees_router = APIRouter()


def _employee_out(emp: Employee) -> EmployeeOut:
    return EmployeeOut(
        id=emp.id,
        name=emp.name,
        email=emp.email,
        department_id=emp.department_id,
        position_id=emp.position_id,
        department_name=emp.department.name if emp.department else None,
        position_name=emp.position.name if emp.position else None,
    )


async def _resolve_refs(
    db: AsyncSession,
    department_id: Optional[int],
    position_id: Optional[int],
):
    if department_id is not None:
        if await db.get(Department, department_id) is None:
            raise HTTPException(status_code=400, detail="존재하지 않는 부서입니다.")
    if position_id is not None:
        if await db.get(Position, position_id) is None:
            raise HTTPException(status_code=400, detail="존재하지 않는 직무입니다.")


@employees_router.get("/employees", response_model=EmployeePage)
async def list_employees(
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = Query(default=None, description="이름·이메일 검색어"),
    department_id: Optional[int] = Query(default=None),
    position_id: Optional[int] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    stmt = select(Employee)
    count_stmt = select(func.count(Employee.id))

    if search:
        pattern = f"%{search.strip()}%"
        cond = Employee.name.ilike(pattern) | Employee.email.ilike(pattern)
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)
    if department_id is not None:
        stmt = stmt.where(Employee.department_id == department_id)
        count_stmt = count_stmt.where(Employee.department_id == department_id)
    if position_id is not None:
        stmt = stmt.where(Employee.position_id == position_id)
        count_stmt = count_stmt.where(Employee.position_id == position_id)

    total = await db.scalar(count_stmt)
    total = total or 0
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = min(page, total_pages)

    result = await db.execute(
        stmt.order_by(Employee.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    employees = result.scalars().unique().all()
    return EmployeePage(
        items=[_employee_out(e) for e in employees],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@employees_router.post("/employees", response_model=EmployeeOut, status_code=201)
async def create_employee(
    payload: EmployeeCreate, db: AsyncSession = Depends(get_db)
):
    await _resolve_refs(db, payload.department_id, payload.position_id)
    emp = Employee(
        name=payload.name,
        email=payload.email,
        department_id=payload.department_id,
        position_id=payload.position_id,
    )
    db.add(emp)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")
    await db.refresh(emp)
    return _employee_out(emp)


@employees_router.put("/employees/{emp_id}", response_model=EmployeeOut)
async def update_employee(
    emp_id: int, payload: EmployeeUpdate, db: AsyncSession = Depends(get_db)
):
    emp = await db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")
    if payload.name is not None:
        emp.name = payload.name
    if payload.email is not None:
        emp.email = payload.email
    # model_fields_set 으로 "보내지 않음"과 "null 로 명시적 전송(미지정으로 변경)"을 구분한다.
    if "department_id" in payload.model_fields_set:
        if payload.department_id is not None:
            await _resolve_refs(db, payload.department_id, None)
        emp.department_id = payload.department_id
    if "position_id" in payload.model_fields_set:
        if payload.position_id is not None:
            await _resolve_refs(db, None, payload.position_id)
        emp.position_id = payload.position_id
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")
    await db.refresh(emp)
    return _employee_out(emp)


@employees_router.delete("/employees/{emp_id}", status_code=204)
async def delete_employee(emp_id: int, db: AsyncSession = Depends(get_db)):
    emp = await db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(status_code=404, detail="직원을 찾을 수 없습니다.")
    await db.delete(emp)
    await db.commit()
