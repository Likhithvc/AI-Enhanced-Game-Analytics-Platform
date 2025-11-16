"""Add heatmaps table

Revision ID: 003
Revises: 002
Create Date: 2025-11-16 12:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'heatmaps',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('level', sa.String(length=100), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('matrix', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_unique_constraint('uq_heatmaps_level_date', 'heatmaps', ['level', 'date'])
    op.create_index(op.f('ix_heatmaps_level'), 'heatmaps', ['level'], unique=False)
    op.create_index(op.f('ix_heatmaps_date'), 'heatmaps', ['date'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_heatmaps_date'), table_name='heatmaps')
    op.drop_index(op.f('ix_heatmaps_level'), table_name='heatmaps')
    op.drop_constraint('uq_heatmaps_level_date', 'heatmaps', type_='unique')
    op.drop_table('heatmaps')
