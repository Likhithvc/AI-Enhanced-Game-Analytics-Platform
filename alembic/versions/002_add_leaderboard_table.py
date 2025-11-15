"""Add leaderboard table

Revision ID: 002
Revises: 001
Create Date: 2025-11-16 00:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create leaderboard table
    op.create_table(
        'leaderboard',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('best_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_played', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('avg_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_played', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )
    op.create_index(op.f('ix_leaderboard_user_id'), 'leaderboard', ['user_id'], unique=False)
    op.create_index(op.f('ix_leaderboard_best_score'), 'leaderboard', ['best_score'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_leaderboard_best_score'), table_name='leaderboard')
    op.drop_index(op.f('ix_leaderboard_user_id'), table_name='leaderboard')
    op.drop_table('leaderboard')
