from typing import Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    employees: Mapped[list["Employee"]] = relationship(back_populates="department")


class Position(Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    employees: Mapped[list["Employee"]] = relationship(back_populates="position")


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    position_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("positions.id", ondelete="SET NULL"), nullable=True
    )

    department: Mapped[Optional["Department"]] = relationship(
        back_populates="employees", lazy="joined"
    )
    position: Mapped[Optional["Position"]] = relationship(
        back_populates="employees", lazy="joined"
    )
