"""Add project_subcontractors table

Revision ID: a1b2c3d4e5f6
Revises: eb9d0afdbe82
Create Date: 2026-01-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'eb9d0afdbe82'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('project_subcontractors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('subcontractor_name', sa.String(length=100), nullable=False),
        sa.Column('labor_type', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_subcontractors_id'), 'project_subcontractors', ['id'], unique=False)
    op.create_index(op.f('ix_project_subcontractors_project_id'), 'project_subcontractors', ['project_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_subcontractors_project_id'), table_name='project_subcontractors')
    op.drop_index(op.f('ix_project_subcontractors_id'), table_name='project_subcontractors')
    op.drop_table('project_subcontractors')
