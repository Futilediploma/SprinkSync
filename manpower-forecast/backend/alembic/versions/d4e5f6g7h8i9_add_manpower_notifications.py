"""Add manpower notification tables

Revision ID: d4e5f6g7h8i9
Revises: c3d4e5f6g7h8
Create Date: 2026-05-07 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6g7h8i9'
down_revision: Union[str, None] = 'c3d4e5f6g7h8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if not _has_table('employees'):
        op.create_table(
            'employees',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('email', sa.String(length=255), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('role', sa.String(length=50), nullable=False),
            sa.Column('active', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.PrimaryKeyConstraint('id'),
        )
    _create_index_if_missing('ix_employees_active', 'employees', ['active'])
    _create_index_if_missing('ix_employees_email', 'employees', ['email'], unique=True)
    _create_index_if_missing('ix_employees_id', 'employees', ['id'])
    _create_index_if_missing('ix_employees_role', 'employees', ['role'])

    _add_column_if_missing('projects', sa.Column('address', sa.String(length=500), nullable=True))
    _add_column_if_missing('projects', sa.Column('superintendent_id', sa.Integer(), nullable=True))
    _add_column_if_missing('projects', sa.Column('pm_id', sa.Integer(), nullable=True))
    _add_column_if_missing('projects', sa.Column('active', sa.Boolean(), nullable=True, server_default='1'))
    _create_index_if_missing('ix_projects_active', 'projects', ['active'])
    _create_index_if_missing('ix_projects_pm_id', 'projects', ['pm_id'])
    _create_index_if_missing('ix_projects_superintendent_id', 'projects', ['superintendent_id'])
    if dialect_name != 'sqlite':
        op.create_foreign_key('fk_projects_superintendent_id_employees', 'projects', 'employees', ['superintendent_id'], ['id'], ondelete='SET NULL')
        op.create_foreign_key('fk_projects_pm_id_employees', 'projects', 'employees', ['pm_id'], ['id'], ondelete='SET NULL')

    if not _has_table('manpower_requests'):
        op.create_table(
            'manpower_requests',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=False),
            sa.Column('requested_by', sa.Integer(), nullable=True),
            sa.Column('foreman_id', sa.Integer(), nullable=True),
            sa.Column('manpower_required', sa.String(length=255), nullable=False),
            sa.Column('requested_trades', sa.String(length=255), nullable=False),
            sa.Column('start_datetime', sa.DateTime(), nullable=False),
            sa.Column('expected_duration', sa.String(length=255), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['foreman_id'], ['employees.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['requested_by'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
    _create_index_if_missing('ix_manpower_requests_foreman_id', 'manpower_requests', ['foreman_id'])
    _create_index_if_missing('ix_manpower_requests_id', 'manpower_requests', ['id'])
    _create_index_if_missing('ix_manpower_requests_project_id', 'manpower_requests', ['project_id'])
    _create_index_if_missing('ix_manpower_requests_requested_by', 'manpower_requests', ['requested_by'])
    _create_index_if_missing('ix_manpower_requests_start_datetime', 'manpower_requests', ['start_datetime'])

    if not _has_table('notifications'):
        op.create_table(
            'notifications',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('manpower_request_id', sa.Integer(), nullable=False),
            sa.Column('recipient_email', sa.String(length=255), nullable=False),
            sa.Column('notification_type', sa.String(length=50), nullable=False),
            sa.Column('provider', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False),
            sa.Column('provider_message_id', sa.String(length=255), nullable=True),
            sa.Column('sent_at', sa.DateTime(), nullable=True),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.Column('attempt_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('next_attempt_at', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['manpower_request_id'], ['manpower_requests.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
    _create_index_if_missing('ix_notifications_id', 'notifications', ['id'])
    _create_index_if_missing('ix_notifications_manpower_request_id', 'notifications', ['manpower_request_id'])
    _create_index_if_missing('ix_notifications_next_attempt_at', 'notifications', ['next_attempt_at'])
    _create_index_if_missing('ix_notifications_recipient_email', 'notifications', ['recipient_email'])
    _create_index_if_missing('ix_notifications_status', 'notifications', ['status'])

    if not _has_table('audit_logs'):
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('actor_user_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=100), nullable=False),
            sa.Column('entity_type', sa.String(length=100), nullable=False),
            sa.Column('entity_id', sa.Integer(), nullable=True),
            sa.Column('message', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
            sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
    _create_index_if_missing('ix_audit_logs_action', 'audit_logs', ['action'])
    _create_index_if_missing('ix_audit_logs_actor_user_id', 'audit_logs', ['actor_user_id'])
    _create_index_if_missing('ix_audit_logs_id', 'audit_logs', ['id'])


def _has_table(table_name: str) -> bool:
    return table_name in inspect(op.get_bind()).get_table_names()


def _has_column(table_name: str, column_name: str) -> bool:
    return any(column['name'] == column_name for column in inspect(op.get_bind()).get_columns(table_name))


def _has_index(table_name: str, index_name: str) -> bool:
    return any(index['name'] == index_name for index in inspect(op.get_bind()).get_indexes(table_name))


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if not _has_column(table_name, column.name):
        op.add_column(table_name, column)


def _create_index_if_missing(index_name: str, table_name: str, columns: list[str], unique: bool = False) -> None:
    if not _has_index(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)


def downgrade() -> None:
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_actor_user_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_action'), table_name='audit_logs')
    op.drop_table('audit_logs')

    op.drop_index(op.f('ix_notifications_status'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_recipient_email'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_next_attempt_at'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_manpower_request_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_manpower_requests_start_datetime'), table_name='manpower_requests')
    op.drop_index(op.f('ix_manpower_requests_requested_by'), table_name='manpower_requests')
    op.drop_index(op.f('ix_manpower_requests_project_id'), table_name='manpower_requests')
    op.drop_index(op.f('ix_manpower_requests_id'), table_name='manpower_requests')
    op.drop_index(op.f('ix_manpower_requests_foreman_id'), table_name='manpower_requests')
    op.drop_table('manpower_requests')

    if op.get_bind().dialect.name != 'sqlite':
        op.drop_constraint('fk_projects_pm_id_employees', 'projects', type_='foreignkey')
        op.drop_constraint('fk_projects_superintendent_id_employees', 'projects', type_='foreignkey')
    op.drop_index(op.f('ix_projects_superintendent_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_pm_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_active'), table_name='projects')
    op.drop_column('projects', 'active')
    op.drop_column('projects', 'pm_id')
    op.drop_column('projects', 'superintendent_id')
    op.drop_column('projects', 'address')

    op.drop_index(op.f('ix_employees_role'), table_name='employees')
    op.drop_index(op.f('ix_employees_id'), table_name='employees')
    op.drop_index(op.f('ix_employees_email'), table_name='employees')
    op.drop_index(op.f('ix_employees_active'), table_name='employees')
    op.drop_table('employees')
