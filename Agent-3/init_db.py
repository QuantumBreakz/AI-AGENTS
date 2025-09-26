#!/usr/bin/env python3
"""
Initialize Agent-3 database tables
"""
import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.db import engine, Base
from app.models import business, call, appointment

async def init_db():
    """Create all database tables"""
    print("🔧 Creating Agent-3 database tables...")
    
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Agent-3 database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
