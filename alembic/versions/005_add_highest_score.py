"""add highest_score to users

Revision ID: 005
Revises: 004
Create Date: 2025-11-20 23:33:08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add highest_score column to users table
    op.add_column('users', sa.Column('highest_score', sa.Integer(), nullable=False, server_default='0'))
    # Remove server_default after column creation
    op.alter_column('users', 'highest_score', server_default=None)


def downgrade() -> None:
    # Remove highest_score column from users table
    op.drop_column('users', 'highest_score')
