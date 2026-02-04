"""Add BFPE headcount columns to projects

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-03 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6g7'
down_revision: Union[str, None] = 'fd781e8b9d9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('bfpe_sprinkler_headcount', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('projects', sa.Column('bfpe_vesda_headcount', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('projects', sa.Column('bfpe_electrical_headcount', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    op.drop_column('projects', 'bfpe_electrical_headcount')
    op.drop_column('projects', 'bfpe_vesda_headcount')
    op.drop_column('projects', 'bfpe_sprinkler_headcount')
