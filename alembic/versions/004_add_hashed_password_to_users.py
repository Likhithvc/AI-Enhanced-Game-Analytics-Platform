"""Add hashed_password column to users

Revision ID: 004
Revises: 003
Create Date: 2025-11-16 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('hashed_password', sa.String(length=255), nullable=False, server_default=''))
    # Remove server_default after backfilling existing rows if necessary
    op.alter_column('users', 'hashed_password', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'hashed_password')
