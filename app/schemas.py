from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DepartmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class DepartmentOut(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_count: int = 0


class PositionBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = None


class PositionOut(PositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_count: int = 0


class EmployeeBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    department_id: Optional[int] = None
    position_id: Optional[int] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None
    position_id: Optional[int] = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    department_name: Optional[str] = None
    position_name: Optional[str] = None


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorResponse(BaseModel):
    detail: str
