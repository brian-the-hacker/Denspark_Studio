"""initial schema
Revision ID: 3b04e44c12e9
Revises: 40e6823587e9
Create Date: 2026-04-30 23:41:43.304911
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '3b04e44c12e9'
down_revision = '40e6823587e9'
branch_labels = None
depends_on = None

def upgrade():
    conn = op.get_bind()
    existing_cols = [col['name'] for col in inspect(conn).get_columns('bookings')]

    with op.batch_alter_table('bookings', schema=None) as batch_op:
        if 'date' not in existing_cols:
            batch_op.add_column(sa.Column('date', sa.String(length=20), nullable=True))
        if 'time' not in existing_cols:
            batch_op.add_column(sa.Column('time', sa.String(length=20), nullable=True))
        if 'location' not in existing_cols:
            batch_op.add_column(sa.Column('location', sa.String(length=200), nullable=True))
        if 'amount' not in existing_cols:
            batch_op.add_column(sa.Column('amount', sa.Integer(), nullable=True))
        if 'notes' not in existing_cols:
            batch_op.add_column(sa.Column('notes', sa.Text(), nullable=True))

def downgrade():
    with op.batch_alter_table('bookings', schema=None) as batch_op:
        batch_op.drop_column('notes')
        batch_op.drop_column('amount')
        batch_op.drop_column('location')
        batch_op.drop_column('time')
        batch_op.drop_column('date')
